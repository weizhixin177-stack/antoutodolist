import { Router, type Request, type Response } from 'express';
import {
  ASRClient,
  Config,
  HeaderUtils,
  LLMClient,
} from 'coze-coding-dev-sdk';

const router = Router();

type Priority = 'high' | 'medium' | 'low';
type CategoryId = 'work' | 'life' | 'study' | 'other';

interface ParsedTodo {
  title: string;
  priority: Priority;
  category: CategoryId;
  deadline?: string;
  location?: string;
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const CATEGORIES: CategoryId[] = ['work', 'life', 'study', 'other'];

/** 规整截止时间为 datetime-local 需要的 "YYYY-MM-DDTHH:mm" 精度 */
function normalizeDeadline(d?: string): string | undefined {
  if (!d) return undefined;
  const m = d.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : undefined;
}

/** 从模型输出中稳健地提取 JSON 对象 */
function extractJson(text: string): ParsedTodo | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as ParsedTodo;
  } catch {
    return null;
  }
}

/**
 * 语音转待办：ASR 语音识别 + LLM 结构化解析。
 * 前端上传 base64 音频 → 本文解析出 title / priority / category / deadline。
 */
router.post('/api/voice-todo', async (req: Request, res: Response) => {
  const { audioBase64, mimeType } = (req.body ?? {}) as {
    audioBase64?: string;
    mimeType?: string;
  };

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    res.status(400).json({ error: '缺少音频数据 audioBase64' });
    return;
  }

  const headers = HeaderUtils.extractForwardHeaders(
    req.headers as Record<string, string>,
  );
  const config = new Config();

  try {
    // 1) 语音转文字（扣子 ASR）
    const asrClient = new ASRClient(config, headers);
    let recognized = '';
    try {
      const result = await asrClient.recognize({
        uid: `antou-${Date.now()}`,
        base64Data: audioBase64,
      });
      recognized = (result.text || '').trim();
    } catch (asrErr) {
      console.error('ASR failed:', asrErr);
      // 若 ASR 失败但已有 mimeType 提示，可能是不支持的编码
      res.status(422).json({
        error: `语音识别失败（编码：${mimeType || '未知'}），请改用 Chrome 或 Safari 重试`,
      });
      return;
    }

    if (!recognized) {
      res.status(422).json({ error: '未能识别到语音内容，请靠近麦克风重复一遍' });
      return;
    }

    // 2) LLM 结构化解析（扣子大模型）
    const parsed = await parseTodoText(recognized, config, headers);

    res.json({
      text: recognized,
      parsed,
    });
  } catch (err) {
    console.error('voice-todo failed:', err);
    res.status(500).json({ error: '语音解析失败，请稍后重试' });
  }
});

/** 共享的 LLM 待办解析：从一句话中提取标题/分类/优先级/截止时间/地点 */
async function parseTodoText(
  text: string,
  config: Config,
  headers: Record<string, string>,
): Promise<ParsedTodo | null> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const nowText = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];

  const sys = [
    '你是待办清单的智能解析器，把用户输入的一句话解析成结构化待办。',
    '分类只取：work(工作) / life(生活) / study(学习) / other(其他)。',
    '优先级只取：high(高) / medium(中) / low(低)。含"紧急/必须/马上/截止/今天内/尽快"等偏急 → high；含"有空/不急/闲暇/什么时候都行"等偏缓 → low；其余 → medium。',
    '若用户明确提到截止时间（如"今晚8点""明天上午""12点前"），结合当前时间换算成本地绝对时间，输出格式 "YYYY-MM-DDTHH:mm"；没有提到就不输出 deadline 字段。',
    '若用户提到地点（如"在公司""去星巴克""到图书馆"），提取最简短的地点名（如"星巴克"）；没有提到就不输出 location 字段。',
    '只输出一个 JSON 对象，不输出任何解释文字，不要 markdown 代码块。',
    '输出格式示例：{"title":"整理周报","priority":"high","category":"work","deadline":"2026-01-01T20:00","location":"公司"}（deadline、location 均可省略）。',
    `当前时间：${nowText}，今天星期${weekday}。`,
  ].join('\n');

  try {
    const llmClient = new LLMClient(config, headers);
    const llmRes = await llmClient.invoke(
      [
        { role: 'system', content: sys },
        { role: 'user', content: text },
      ],
      { model: 'doubao-seed-2-0-mini-260215', temperature: 0.1 },
    );
    const raw = extractJson(llmRes.content);
    if (raw && raw.title) {
      return {
        title: raw.title,
        priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
        category: CATEGORIES.includes(raw.category) ? raw.category : 'other',
        deadline: normalizeDeadline(raw.deadline),
        location: raw.location ? String(raw.location).slice(0, 30) : undefined,
      };
    }
    return null;
  } catch (llmErr) {
    console.error('LLM parse failed:', llmErr);
    return null;
  }
}

/**
 * 文本智能理解：用户直接输入一句话 → 解析出 title / priority / category / deadline / location。
 * 用于去掉手动选择截止时间，由 AI 自动理解"今晚8点""明天上午"等。
 */
router.post('/api/parse-todo', async (req: Request, res: Response) => {
  const { text } = (req.body ?? {}) as { text?: string };
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: '缺少待办文本 text' });
    return;
  }

  const headers = HeaderUtils.extractForwardHeaders(
    req.headers as Record<string, string>,
  );
  const config = new Config();

  try {
    const parsed = await parseTodoText(text.trim(), config, headers);
    res.json({ text: text.trim(), parsed });
  } catch (err) {
    console.error('parse-todo failed:', err);
    res.status(500).json({ error: '智能理解失败，请稍后重试' });
  }
});

export default router;