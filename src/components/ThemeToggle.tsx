import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'full';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, variant = 'icon' }) => {
  const { theme, setTheme } = useTheme();

  if (variant === 'full') {
    const options: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
      { value: 'light', icon: <Sun size={14} />, label: 'Clair' },
      { value: 'system', icon: <Monitor size={14} />, label: 'Auto' },
      { value: 'dark', icon: <Moon size={14} />, label: 'Sombre' },
    ];
    return (
      <div className={cn('flex rounded-xl border border-border bg-muted/40 p-1 gap-1', className)}>
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all',
              theme === o.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  const cycle = () => {
    const map: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    type Theme = 'light' | 'dark' | 'system';
    setTheme(map[theme as Theme]);
  };

  return (
    <button
      onClick={cycle}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-sm transition-all hover:bg-card',
        className
      )}
      title={`Thème : ${theme}`}
    >
      {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
    </button>
  );
};

export default ThemeToggle;
