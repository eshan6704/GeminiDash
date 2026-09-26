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
    <div className="w-full overflow-hidden border-b flex items-center h-8 transition-colors bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border)] text-[var(--theme-text-muted)]">
      <div className="flex items-center gap-2 px-3 h-full z-10 font-bold text-[9px] uppercase tracking-widest border-r border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[var(--theme-text-primary)]">LIVE FEED</span>
      </div>
      
      <div className="flex-1 relative overflow-hidden h-full">
        <div className="absolute flex items-center h-full whitespace-nowrap animate-marquee hover:pause">
          {/* Double the news to create a seamless loop */}
          {[...news, ...news].map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 px-6 border-r border-[var(--theme-border-subtle)]/30">
              <span className={`text-[9px] font-bold uppercase flex items-center gap-1 ${
                item.sentiment === 'positive' ? 'text-emerald-500' : 
                item.sentiment === 'negative' ? 'text-rose-500' : 
                'text-[var(--theme-text-muted)]'
              }`}>
                {item.sentiment === 'positive' && <TrendingUp className="w-2.5 h-2.5" />}
                {item.sentiment === 'negative' && <TrendingDown className="w-2.5 h-2.5" />}
                {item.sentiment === 'neutral' && <Minus className="w-2.5 h-2.5" />}
                {item.sentiment}
              </span>
              <p className="text-[10px] font-medium tracking-tight text-[var(--theme-text-secondary)]">
                {item.headline}
                <span className="ml-2 opacity-40 font-mono text-[8px] uppercase">[{item.source}]</span>
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
          animation: marquee 80s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};
