import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      className="theme-aware relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-[#fffdf8] text-ink-soft shadow-sm transition-all duration-200 hover:shadow-card hover:text-ink dark:border-white/10 dark:bg-[#1f1d19] dark:text-[#cfc8ba] dark:hover:text-[#ece7dc]"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] animate-pop-in" strokeWidth={1.8} />
      ) : (
        <Moon className="h-[18px] w-[18px] animate-pop-in" strokeWidth={1.8} />
      )}
    </button>
  );
}
