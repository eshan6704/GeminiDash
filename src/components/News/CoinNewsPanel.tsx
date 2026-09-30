import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Search,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Sparkles,
  Tag,
  Clock,
  ShieldCheck,
  Check,
  Filter,
} from 'lucide-react';

export interface NewsArticleItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeAgo: string;
  keyTakeaway?: string;
}

export interface GroundingSourceItem {
  title: string;
  url: string;
}

export interface CoinNewsData {
  symbol: string;
  name: string;
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number;
  sentimentSummary: string;
  trendingTopics: string[];
  articles: NewsArticleItem[];
  searchSources?: GroundingSourceItem[];
  source?: string;
}

interface CoinNewsPanelProps {
  symbol: string;
  name?: string;
  category?: string;
  currentPrice?: number;
  change24h?: number;
}

export const CoinNewsPanel: React.FC<CoinNewsPanelProps> = ({
  symbol,
  name,
  category = 'Layer 1',
  currentPrice,
  change24h,
}) => {
  const coinName = name || symbol;
  const [newsData, setNewsData] = useState<CoinNewsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [lastFetchedSymbol, setLastFetchedSymbol] = useState<string>('');

  const fetchNews = async (customTopic?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/coin-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name: coinName,
          category,
          customQuery: customTopic !== undefined ? customTopic : searchQuery,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          setNewsData(json);
          setLastFetchedSymbol(symbol);
        }
      }
    } catch (err) {
      console.error('Error fetching coin news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when selected symbol changes
  useEffect(() => {
    if (symbol && symbol !== lastFetchedSymbol) {
      setActiveTopic('');
      setSearchQuery('');
      fetchNews('');
    }
  }, [symbol]);

  const handleTopicClick = (topic: string) => {
    if (activeTopic === topic) {
      setActiveTopic('');
      fetchNews('');
    } else {
      setActiveTopic(topic);
      fetchNews(topic);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(searchQuery);
  };

  const filteredArticles = (newsData?.articles || []).filter((art) => {
    if (sentimentFilter !== 'ALL' && art.sentiment !== sentimentFilter) return false;
    return true;
  });

  const sentimentScore = newsData?.sentimentScore ?? 75;
  const overallSentiment = newsData?.overallSentiment || (change24h && change24h >= 0 ? 'BULLISH' : 'NEUTRAL');

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-4 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                Latest Grounded News &amp; Market Catalysts ({symbol})
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> Google Search Grounding
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-text-muted)]">
              Real-time breaking articles, institutional coverage, and protocol developments
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchNews(activeTopic)}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Searching...' : 'Refresh News'}</span>
        </button>
      </div>

      {/* Sentiment & Overview Banner */}
      {newsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Sentiment Gauge Card */}
          <div className="p-3 rounded-xl border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--theme-text-secondary)]">
              <span>Market Media Sentiment</span>
              <span
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  overallSentiment === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : overallSentiment === 'BEARISH'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-zinc-500/20 text-zinc-400'
                }`}
              >
                {overallSentiment}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    sentimentScore >= 60 ? 'bg-emerald-500' : sentimentScore <= 40 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, sentimentScore))}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)]">
                {sentimentScore}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-text-muted)] line-clamp-2">
              {newsData.sentimentSummary}
            </p>
          </div>

          {/* Trending Search Topics */}
          <div className="md:col-span-2 p-3 rounded-xl border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Trending Keywords &amp; Catalysts
              </span>
              <span className="text-[10px] text-[var(--theme-text-muted)] font-mono">Click to filter news</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(newsData.trendingTopics || []).map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTopicClick(topic)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeTopic === topic
                      ? 'bg-cyan-500 text-black font-bold shadow-sm'
                      : 'bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Keyword Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Sentiment Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)]">
          {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSentimentFilter(filter)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                sentimentFilter === filter
                  ? filter === 'BULLISH'
                    ? 'bg-emerald-500 text-black'
                    : filter === 'BEARISH'
                    ? 'bg-rose-500 text-white'
                    : 'bg-zinc-300 dark:bg-zinc-700 text-black dark:text-white'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Custom Grounded Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--theme-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${symbol} news (e.g. ETF, SEC, Upgrade, Whales)...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:border-cyan-500"
          />
        </form>
      </div>

      {/* Articles Feed */}
      {isLoading ? (
        <div className="p-8 rounded-xl border border-[var(--theme-border-subtle)] bg-[var(--theme-bg-card-subtle)] text-center space-y-2 font-mono">
          <div className="flex justify-center">
            <Globe className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
          <div className="text-xs font-bold text-[var(--theme-text-primary)]">
            Searching Live Web for {coinName} ({symbol}) News...
          </div>
          <div className="text-[11px] text-[var(--theme-text-muted)]">
            Fetching verified headlines, sentiment, and catalysts via Google Search tool
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-[var(--theme-border)] text-center text-xs text-[var(--theme-text-muted)]">
          No articles matching filter. Try clicking "Refresh News" or clearing filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredArticles.map((article, idx) => {
            const isBull = article.sentiment === 'BULLISH';
            const isBear = article.sentiment === 'BEARISH';
            const fallbackGoogleUrl = `https://www.google.com/search?q=${encodeURIComponent(article.title)}`;
            const articleUrl = article.url && article.url.startsWith('http') ? article.url : fallbackGoogleUrl;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card-subtle)] hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-2.5 shadow-sm"
              >
                <div>
                  {/* Metadata top bar */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[var(--theme-text-muted)] mb-1">
                    <div className="flex items-center gap-1.5 font-sans font-semibold text-[var(--theme-text-secondary)]">
                      <span>{article.source}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-[10px]">
                        <Clock className="w-2.5 h-2.5" />
                        {article.timeAgo}
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isBull
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isBear
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}
                    >
                      {article.sentiment}
                    </span>
                  </div>

                  {/* Headline */}
                  <h4 className="text-xs font-bold text-[var(--theme-text-primary)] hover:text-cyan-400 transition-colors leading-snug">
                    <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-1.5 group">
                      <span>{article.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-cyan-400 transition-opacity mt-0.5" />
                    </a>
                  </h4>

                  {/* Summary */}
                  <p className="text-[11px] text-[var(--theme-text-secondary)] font-sans mt-1.5 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                {/* Key Takeaway box */}
                {article.keyTakeaway && (
                  <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] text-[10px] flex items-start gap-1.5 text-[var(--theme-text-primary)]">
                    <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-400">Key Takeaway:</strong> {article.keyTakeaway}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grounding Web Sources Footer */}
      {newsData?.searchSources && newsData.searchSources.length > 0 && (
        <div className="pt-3 border-t border-[var(--theme-border-subtle)] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[var(--theme-text-muted)]">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>Search Sources Grounded via Google:</span>
            <div className="flex flex-wrap gap-2">
              {newsData.searchSources.slice(0, 4).map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-cyan-400 truncate max-w-[180px]"
                >
                  {src.title}
                </a>
              ))}
            </div>
          </div>
          <span className="text-cyan-400 font-semibold">Live Google Search Engine</span>
        </div>
      )}
    </div>
  );
};
