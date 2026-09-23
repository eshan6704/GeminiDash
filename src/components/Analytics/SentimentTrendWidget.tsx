import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SentimentData {
  time: string;
  sentiment: number;
}

export const SentimentTrendWidget: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { isLight } = useTheme();
  const [data, setData] = useState<SentimentData[]>([]);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const response = await fetch('/api/gemini/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        });
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Sentiment fetch error:', err);
      }
    };
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-neutral-800'}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        <h3 className="font-black text-sm">Market Sentiment Trend</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip />
            <Line type="monotone" dataKey="sentiment" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
