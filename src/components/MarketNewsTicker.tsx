import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NewsItem {
  id: string;
  headline: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
}

export const MarketNewsTicker: React.FC = () => {
  const { isLight } = useTheme();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/gemini/market-news', {
          method: 'POST',
        });
        const data = await response.json();
        if (data.news) {
          setNews(data.news);
        }
      } catch (err) {
        console.error('Failed to fetch market news:', err);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000); // Update every 10 mins
    return () => clearInterval(interval);
  }, []);

  if (news.length === 0) return null;

  return (
    <div className={`w-full overflow-hidden border-b flex items-center h-10 ${
      isLight ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-neutral-950 text-indigo-400 border-neutral-800'
    }`}>
      <div className={`flex items-center gap-2 px-4 h-full z-10 font-black text-[10px] uppercase tracking-widest border-r ${
        isLight ? 'bg-indigo-700 border-indigo-500' : 'bg-neutral-900 border-neutral-800'
      }`}>
        <Newspaper className="w-3.5 h-3.5" />
        <span>Live Feed</span>
      </div>
      
      <div className="flex-1 relative overflow-hidden h-full">
        <div className="absolute flex items-center h-full whitespace-nowrap animate-marquee hover:pause">
          {/* Double the news to create a seamless loop */}
          {[...news, ...news].map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-8 border-r border-neutral-800/30">
              <span className={`text-[10px] font-bold uppercase ${
                item.sentiment === 'positive' ? 'text-emerald-400' : 
                item.sentiment === 'negative' ? 'text-rose-400' : 
                'text-neutral-400'
              }`}>
                {item.sentiment === 'positive' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                {item.sentiment === 'negative' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                {item.sentiment === 'neutral' && <Minus className="w-3 h-3 inline mr-1" />}
                {item.sentiment}
              </span>
              <p className="text-xs font-medium tracking-tight">
                {item.headline}
                <span className="ml-2 opacity-50 font-mono text-[9px] uppercase">[{item.source}]</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};
