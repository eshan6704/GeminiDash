import React from 'react';
import {
  Globe,
  Sun,
  Moon,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { isLight, toggleTheme } = useTheme();

  return (
    <header
      className={`border-b sticky top-0 z-40 transition-colors ${
        isLight
          ? 'bg-white/95 backdrop-blur border-slate-200 text-slate-900 shadow-sm'
          : 'bg-neutral-900/95 backdrop-blur border-neutral-800 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Terminal Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Globe className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base sm:text-lg bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                Institutional Market Workstation
              </span>
              <span
                className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLight
                    ? 'bg-orange-50 text-orange-800 border-orange-200'
                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}
              >
                NSE • Global • Crypto
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch & External App Gateways */}
        <div className="flex items-center gap-2">
          {/* Direct Link to Deployed Crypto App */}
          <a
            href="https://crypto.eshanpatel.in/"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
            }`}
            title="Launch Deployed Crypto Application (https://crypto.eshanpatel.in/)"
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Crypto App</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Direct Link to HF Market API */}
          <a
            href="https://eshan6704-marketapi2.hf.space/"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
            title="NSE Direct HF Market API Endpoint"
          >
            <span>HF Market API</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* White / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
            }`}
            title={isLight ? 'Switch to Dark Theme' : 'Switch to White Theme'}
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-mono text-[11px]">White Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[11px]">Dark Theme</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
