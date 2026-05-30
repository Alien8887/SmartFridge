import React from 'react';
import { Snowflake, Sun, Moon, LogOut, Menu, X, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  username:         string;
  darkMode:         boolean;
  setDarkMode:      (value: boolean) => void;
  onLogout:         () => void;
  mobileMenuOpen:   boolean;
  setMobileMenuOpen:(value: boolean) => void;
  isConnected?:     boolean;
  theme:            any;
}

export function Header({
  username, darkMode, setDarkMode, onLogout,
  mobileMenuOpen, setMobileMenuOpen, isConnected, theme
}: HeaderProps) {
  return (
    <div className={`${theme.card} border-b backdrop-blur-xl sticky top-0 z-50 shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-xl ${theme.hover}`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center animate-glow-pulse">
            <Snowflake className="w-6 md:w-7 h-6 md:h-7 text-white" />
          </div>

          <div>
            <h1 className={`text-lg md:text-2xl font-bold ${theme.text}`}>Smart Fridge</h1>
            <div className="flex items-center gap-2">
              <p className={`text-xs ${theme.textMuted} hidden sm:block`}>
                Welcome, {username}
              </p>
              {isConnected !== undefined && (
                <div className="hidden sm:flex items-center gap-1">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Wifi className="w-3 h-3" />
                      <span>Live</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <WifiOff className="w-3 h-3" />
                      <span>Offline</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 md:p-3 rounded-xl ${theme.hover} transition-colors`}
            aria-label="Toggle dark mode"
          >
            {darkMode
              ? <Sun  className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} />
              : <Moon className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} />}
          </button>
          <button
            onClick={onLogout}
            className={`p-2 md:p-3 rounded-xl ${theme.hover} transition-colors`}
            aria-label="Log out"
          >
            <LogOut className={`w-4 md:w-5 h-4 md:h-5 ${theme.accent}`} />
          </button>
        </div>

      </div>
    </div>
  );
}