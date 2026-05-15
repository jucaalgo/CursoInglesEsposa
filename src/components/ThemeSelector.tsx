import React, { useState } from 'react';
import { useTheme, THEMES, type ThemeId } from '../hooks/useTheme';
import { Palette, X, Check } from 'lucide-react';

const THEME_PREVIEWS: Record<ThemeId, { gradient: string; emoji: string }> = {
  midnight: { gradient: 'from-indigo-600 to-purple-700', emoji: '🌙' },
  aurora: { gradient: 'from-violet-600 to-cyan-500', emoji: '🌌' },
  forest: { gradient: 'from-emerald-600 to-teal-600', emoji: '🌿' },
  sunset: { gradient: 'from-orange-500 to-rose-600', emoji: '🌅' },
  ocean: { gradient: 'from-sky-500 to-indigo-600', emoji: '🌊' },
  light: { gradient: 'from-indigo-500 to-violet-400', emoji: '☀️' },
};

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-secondary)',
        }}
        title="Change Theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in-scale"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-3xl overflow-hidden animate-in-scale"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Header */}
            <div
              className="p-6 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border-default)' }}
            >
              <div>
                <h2 className="text-2xl font-black italic tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  CHOOSE YOUR VIBE
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                  Personalize your learning experience
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {(Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][]).map(([id, colors]) => {
                const preview = THEME_PREVIEWS[id];
                const isActive = theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => { setTheme(id); }}
                    className="relative p-4 rounded-2xl text-left transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isActive ? 'var(--accent-primary-muted)' : 'var(--bg-tertiary)',
                      border: isActive ? `2px solid var(--accent-primary)` : '2px solid var(--border-default)',
                      boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
                    }}
                  >
                    {/* Color Preview Bar */}
                    <div className={`h-2 rounded-full bg-gradient-to-r ${preview.gradient} mb-3`} />

                    {/* Theme Info */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{preview.emoji}</span>
                      {isActive && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center animate-in-scale"
                          style={{ background: 'var(--accent-primary)', color: 'white' }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {colors.name}
                    </p>

                    {/* Color Swatches */}
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded-full" style={{ background: colors.accent.primary }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: colors.accent.secondary }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: colors.success }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: colors.bg.tertiary, border: '1px solid var(--border-default)' }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Apply Button */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full h-12 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  boxShadow: 'var(--shadow-accent)',
                }}
              >
                Looks Great!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSelector;