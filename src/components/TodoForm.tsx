import { useState, type FormEvent } from 'react';
import { CornerDownLeft, Loader2, Plus, Sparkles } from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '../lib/constants';
import { deadlineStringToTs, parseTodoText } from '../lib/parseTodo';
import type { CategoryId, Priority } from '../types';
import VoiceInput from './VoiceInput';

interface TodoFormProps {
  onAdd: (
    title: string,
    category: CategoryId,
    priority: Priority,
    deadline?: number,
    location?: string,
  ) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [voiceApplied, setVoiceApplied] = useState(false);
  const [parsing, setParsing] = useState(false);

  const reset = () => {
    setTitle('');
    setDeadline('');
    setLocation('');
    setVoiceApplied(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || parsing) return;

    // 语音已解析过：直接用解析结果，不重复调用 AI
    if (voiceApplied) {
      onAdd(
        trimmed,
        category,
        priority,
        deadlineStringToTs(deadline) ?? undefined,
        location || undefined,
      );
      reset();
      return;
    }

    // 手动输入：交给 AI 理解文字里的时间、地点、优先级、分类
    setParsing(true);
    try {
      const parsed = await parseTodoText(trimmed);
      if (parsed) {
        onAdd(
          parsed.title || trimmed,
          parsed.category || category,
          parsed.priority || priority,
          deadlineStringToTs(parsed.deadline),
          parsed.location,
        );
      } else {
        // AI 不可用（如桌面壳无后端）：按原文 + 当前选择记下
        onAdd(trimmed, category, priority);
      }
    } finally {
      setParsing(false);
      reset();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="theme-aware animate-fade-up rounded-xl border border-ink/[0.07] bg-[#fffdf8] p-4 shadow-card dark:border-white/[0.08] dark:bg-[#1f1d19]"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setVoiceApplied(false);
          }}
          placeholder={
            voiceApplied
              ? 'AI 已识别待办，可微调后回车记下…'
              : '直接写，如「今晚8点完成华为项目」，AI 自动理解时间与优先级'
          }
          maxLength={120}
          aria-label="待办内容"
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint dark:text-[#ece7dc] dark:placeholder:text-[#7d7668]"
        />
        <VoiceInput
          onParsed={(p) => {
            setTitle(p.title);
            setCategory(p.category);
            setPriority(p.priority);
            setDeadline(p.deadline ?? '');
            setLocation(p.location ?? '');
            setVoiceApplied(true);
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink/[0.06] pt-3 dark:border-white/[0.07]">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="radiogroup"
          aria-label="选择分类"
        >
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const selected = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(item.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                  selected
                    ? 'bg-pine-600 text-white shadow-sm dark:bg-pine-500 dark:text-[#0f1a14]'
                    : 'bg-paper-deep text-ink-soft hover:text-ink dark:bg-white/[0.06] dark:text-[#a8a194] dark:hover:text-[#ece7dc]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-lg bg-paper-deep p-0.5 dark:bg-white/[0.06]"
            role="radiogroup"
            aria-label="选择优先级"
          >
            {PRIORITIES.map((item) => {
              const selected = priority === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPriority(item.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
                    selected
                      ? `${item.chipLight} ${item.chipDark} bg-white shadow-sm dark:bg-white/[0.1]`
                      : 'text-ink-faint hover:text-ink-soft dark:text-[#8d8678] dark:hover:text-[#cfc8ba]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${item.dot}`}
                    aria-hidden
                  />
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!title.trim() || parsing}
            className="inline-flex items-center gap-1 rounded-lg bg-pine-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-pine-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-pine-500 dark:text-[#0f1a14] dark:hover:bg-[#6fb38d]"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                AI 理解中
              </>
            ) : voiceApplied ? (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.2} />
                记下
                <CornerDownLeft className="h-3 w-3 opacity-70" strokeWidth={2} />
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" strokeWidth={2.2} />
                记下
                <CornerDownLeft className="h-3 w-3 opacity-70" strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
