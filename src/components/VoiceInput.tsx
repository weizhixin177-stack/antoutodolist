import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square, Sparkles } from 'lucide-react';
import { apiFetch, resolveApiBase } from '../lib/api';

type Priority = 'high' | 'medium' | 'low';
type CategoryId = 'work' | 'life' | 'study' | 'other';

export interface ParsedVoiceTodo {
  title: string;
  priority: Priority;
  category: CategoryId;
  deadline?: string; // "YYYY-MM-DDTHH:mm"
  location?: string;
}

interface VoiceInputProps {
  onParsed: (parsed: ParsedVoiceTodo) => void;
  disabled?: boolean;
}

/** 按浏览器能力优选 ASR 支持的编码（OGG OPUS / M4A） */
function pickMimeType(): string {
  const candidates = ['audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm;codecs=opus'];
  if (typeof MediaRecorder === 'undefined') return '';
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceInput({ onParsed, disabled }: VoiceInputProps) {
  // 是否可用（同源或云端 API 可达即可用，桌面壳会自动回退云端）
  const [available, setAvailable] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [okText, setOkText] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeRef = useRef('');

  // 探测后端是否可达（同源 → 云端域名 依次尝试）
  useEffect(() => {
    let cancelled = false;
    resolveApiBase().then((base) => {
      if (!cancelled) setAvailable(base !== null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 卸载时释放麦克风轨道
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (available === null) return null; // 探测中，先不渲染
  if (available === false) return null; // 无后端（如 Tauri 桌面壳），隐藏语音入口

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    setError('');
    setOkText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime;
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      // Tauri 桌面壳 protocol 为 tauri:，据此区分提示文案
      const isDesktop = !window.location.protocol.startsWith('http');
      setError(
        isDesktop
          ? '无法访问麦克风：请在 系统设置 → 隐私与安全性 → 麦克风 中允许本应用'
          : '无法访问麦克风，请在浏览器设置中允许后重试',
      );
    }
  };

  const finishRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setRecording(false);
    setBusy(true);
    setError('');

    const done = new Promise<void>((resolve) => {
      // 等浏览器落完最后一块音频、触发 stop 后再停止轨道，避免截断尾部
      recorder.onstop = () => {
        stopStream();
        resolve();
      };
    });

    try {
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.stop();
      await done;
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/ogg' });
      const base64 = await blobToBase64(blob);

      const resp = await apiFetch('/api/voice-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: recorder.mimeType || mimeRef.current,
        }),
      });
      if (!resp) throw new Error('AI 服务当前不可达，请检查网络后重试');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '识别失败');

      if (data.parsed && data.parsed.title) {
        onParsed(data.parsed);
        setOkText('已识别，可确认后记下');
      } else {
        setOkText(`识别：${data.text || ''}（无法自动分类，请手动填写）`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '语音识别失败，请重试');
    } finally {
      setBusy(false);
      recorderRef.current = null;
      stopStream();
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (recording) {
      void finishRecording();
    } else {
      void startRecording();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-cinnabar-600 dark:text-[#e88070]">{error}</span>}
      {okText && (
        <span className="inline-flex items-center gap-1 text-xs text-pine-600 dark:text-[#5ea37e]">
          <Sparkles className="h-3 w-3" strokeWidth={2} />
          {okText}
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || disabled}
        aria-label={recording ? '结束并识别语音' : '语音输入待办'}
        title={recording ? '点击结束并识别' : '点击说话，AI 自动识别内容与优先级'}
        className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-90 disabled:opacity-50 ${
          recording
            ? 'bg-cinnabar-500 text-white shadow-[0_0_0_0_rgba(207,74,55,0.5)] animate-pulse'
            : 'bg-paper-deep text-ink-soft hover:bg-pine-100 hover:text-pine-600 dark:bg-white/[0.06] dark:text-[#a8a194] dark:hover:bg-pine-500/15 dark:hover:text-[#5ea37e]'
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : recording ? (
          <Square className="h-3.5 w-3.5" strokeWidth={2.4} />
        ) : (
          <Mic className="h-4 w-4" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}