import React from 'react';
import { Snowflake, Sun, Moon, LogOut, Menu, X, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { Theme } from '../../types';

interface HeaderProps {
  username: string; role?: string; darkMode: boolean; setDarkMode: (v: boolean) => void;
  onLogout: () => void; mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
  isConnected: boolean; theme: Theme;
}

export function Header({ username, role, darkMode, setDarkMode, onLogout, mobileMenuOpen, setMobileMenuOpen, isConnected, theme }: HeaderProps) {
  return (
    // FIXED: theme.border ?? '' — Theme.border is OPTIONAL in types/index.ts
    // (border?: string). Interpolating it unconditionally means if useTheme.ts
    // ever produces a theme object without that field, the literal text
    // "undefined" gets written straight into the className attribute.
    <header className={`${theme.card} ${theme.border ?? ''} border-b backdrop-blur-xl sticky top-0 z-50 shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${theme.hover} ${theme.text}`}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} type="button">
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30 flex items-center justify-center flex-shrink-0">
            <Snowflake className="w-6 md:w-7 h-6 md:h-7 text-white" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h1 className={`text-lg md:text-2xl font-bold ${theme.text} truncate`}>Smart Fridge</h1>
            <p className={`text-xs ${theme.textMuted} hidden sm:flex items-center gap-1.5 truncate`}>
              {username}
              {role && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
                  <ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />{role}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected
              ? (darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
              : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
          }`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" aria-hidden="true" /> : <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />}
            <span aria-live="polite">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <div className={`sm:hidden w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />

          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 md:p-3 rounded-xl transition-colors ${theme.hover}`} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} type="button">
            {darkMode ? <Sun className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} aria-hidden="true" /> : <Moon className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} aria-hidden="true" />}
          </button>
          <button onClick={onLogout} className={`p-2 md:p-3 rounded-xl transition-colors ${theme.hover}`} aria-label="Log out" type="button">
            <LogOut className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}