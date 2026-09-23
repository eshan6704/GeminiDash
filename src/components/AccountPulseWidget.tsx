import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  totalPnL: number;
  winRate: number;
}

export const AccountPulseWidget: React.FC<Props> = ({ totalPnL, winRate }) => {
  const { isLight } = useTheme();
  const [summary, setSummary] = useState<string>('Analyzing your trading performance...');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/gemini/account-pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalPnL, winRate }),
        });
        const data = await response.json();
        setSummary(data.summary || 'Performance analyzed.');
      } catch (err) {
        setSummary('Unable to fetch account pulse.');
      }
    };
    fetchSummary();
  }, [totalPnL, winRate]);

  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-900/50 text-amber-300'}`}>
      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
      <p className="font-medium">{summary}</p>
    </div>
  );
};
