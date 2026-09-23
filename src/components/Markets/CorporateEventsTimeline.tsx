import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar,
  Clock,
  FileText,
  Gift,
  Scissors,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Filter,
  Sparkles,
  Building2,
  BellRing,
} from 'lucide-react';
import { StockConstituentItem } from './StockConstituentsView';

interface CorporateEventsTimelineProps {
  stock: StockConstituentItem;
}

export interface CorporateEvent {
  id: string;
  title: string;
  category: 'EARNINGS' | 'BOARD_MEETING' | 'SPLIT_BONUS' | 'DIVIDEND' | 'AGM';
  dateStr: string;
  daysRemaining: number;
  status: 'UPCOMING' | 'TODAY' | 'COMPLETED';
  description: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedVolatility: string;
  historicalReaction?: string;
  keyDetails?: Array<{ label: string; value: string }>;
}

export const CorporateEventsTimeline: React.FC<CorporateEventsTimelineProps> = ({ stock }) => {
  const { isLight } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'EARNINGS' | 'BOARD_MEETING' | 'DIVIDEND_SPLIT'>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Generate dynamic upcoming timeline events for the selected stock
  const events: CorporateEvent[] = [
    {
      id: 'evt-board-1',
      title: 'Board Meeting & Capital Allocation Review',
      category: 'BOARD_MEETING',
      dateStr: '28 OCT 2026',
      daysRemaining: 4,
      status: 'UPCOMING',
      description: `Board of Directors of ${stock.name} to convene to consider un-audited quarterly financial results, capex plans, and interim dividend declaration.`,
      impactLevel: 'HIGH',
      expectedVolatility: '± 2.8%',
      historicalReaction: 'Avg +1.4% move post meeting',
      keyDetails: [
        { label: 'Meeting Time', value: '02:30 PM IST' },
        { label: 'Key Agenda', value: 'Financial Results & Capital Allocation' },
        { label: 'Outcome Release', value: 'Post Market Hours (NSE/BSE Filings)' },
      ],
    },
    {
      id: 'evt-earnings-1',
      title: 'Q3 FY26 Earnings Release & Analyst Call',
      category: 'EARNINGS',
      dateStr: '12 NOV 2026',
      daysRemaining: 19,
      status: 'UPCOMING',
      description: `Official quarterly earnings announcement for ${stock.name}. Management conference call with institutional analysts scheduled at 05:00 PM IST.`,
      impactLevel: 'HIGH',
      expectedVolatility: '± 4.2%',
      historicalReaction: 'Beat estimates 3 of last 4 quarters',
      keyDetails: [
        { label: 'Consensus EPS', value: `₹${(stock.peRatio * 0.85).toFixed(1)}` },
        { label: 'Consensus Revenue', value: '₹16,850 Cr (+14.2% YoY)' },
        { label: 'Analyst Call Link', value: 'Institutional Investor Portal' },
      ],
    },
    {
      id: 'evt-div-1',
      title: 'Interim Dividend Ex-Date (₹18.50/share)',
      category: 'DIVIDEND',
      dateStr: '24 NOV 2026',
      daysRemaining: 31,
      status: 'UPCOMING',
      description: `Ex-dividend trading date for interim payout of ₹18.50 per equity share. Shareholders on record as of 25 NOV 2026 eligible for credit.`,
      impactLevel: 'MEDIUM',
      expectedVolatility: 'Stock adjusts by dividend value',
      historicalReaction: 'Quick yield recovery within 6 sessions',
      keyDetails: [
        { label: 'Dividend Amount', value: '₹18.50 per share' },
        { label: 'Record Date', value: '25 NOV 2026' },
        { label: 'Expected Payout Date', value: '10 DEC 2026' },
      ],
    },
    {
      id: 'evt-split-1',
      title: 'Stock Sub-Division / Split Record Date',
      category: 'SPLIT_BONUS',
      dateStr: '15 DEC 2026',
      daysRemaining: 52,
      status: 'UPCOMING',
      description: `Proposed 1:5 stock split (Face value sub-division from ₹10 to ₹2) to increase retail liquidity and market accessibility.`,
      impactLevel: 'HIGH',
      expectedVolatility: 'High retail volume inflow',
      historicalReaction: '+6.2% rally pre-split record date',
      keyDetails: [
        { label: 'Original Face Value', value: '₹10 per share' },
        { label: 'New Face Value', value: '₹2 per share' },
        { label: 'Post-Split Shares', value: '5x Original Holdings' },
      ],
    },
    {
      id: 'evt-agm-1',
      title: 'Annual General Meeting (AGM) & Keynote',
      category: 'AGM',
      dateStr: '18 JAN 2027',
      daysRemaining: 86,
      status: 'UPCOMING',
      description: `Annual General Meeting of shareholders to approve annual report, auditor appointments, and strategic expansion roadmap for FY27.`,
      impactLevel: 'MEDIUM',
      expectedVolatility: '± 1.8%',
      historicalReaction: 'Positive long-term institutional commentary',
      keyDetails: [
        { label: 'Location', value: 'Hybrid / Virtual Shareholder Stream' },
        { label: 'Voting Window', value: '14 JAN - 17 JAN 2027' },
      ],
    },
  ];

  const filteredEvents = events.filter((evt) => {
    if (filter === 'ALL') return true;
    if (filter === 'EARNINGS') return evt.category === 'EARNINGS';
    if (filter === 'BOARD_MEETING') return evt.category === 'BOARD_MEETING';
    if (filter === 'DIVIDEND_SPLIT') return evt.category === 'DIVIDEND' || evt.category === 'SPLIT_BONUS';
    return true;
  });

  const getCategoryBadge = (category: CorporateEvent['category']) => {
    switch (category) {
      case 'EARNINGS':
        return {
          label: 'Q3 Financial Results',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <FileText className="w-3.5 h-3.5" />,
        };
      case 'BOARD_MEETING':
        return {
          label: 'Board Meeting',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Users className="w-3.5 h-3.5" />,
        };
      case 'DIVIDEND':
        return {
          label: 'Interim Dividend',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Gift className="w-3.5 h-3.5" />,
        };
      case 'SPLIT_BONUS':
        return {
          label: 'Stock Split (1:5)',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Scissors className="w-3.5 h-3.5" />,
        };
      case 'AGM':
        return {
          label: 'Shareholder AGM',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <Building2 className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: 'Corporate Event',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: <Calendar className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* HEADER & FILTERS */}
      <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm font-mono">
            <Calendar className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>Corporate Action Roadmap & Event Calendar</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              {stock.symbol} ({stock.exchange})
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'EARNINGS', label: '📊 Earnings' },
              { id: 'BOARD_MEETING', label: '🏛️ Board Meetings' },
              { id: 'DIVIDEND_SPLIT', label: '🎁 Dividends & Splits' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                  filter === f.id
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-black'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border-neutral-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          Track official NSE/BSE corporate announcements, board meeting outcomes, earnings calls, dividend ex-dates, and stock splits for <strong>{stock.name}</strong>.
        </p>
      </div>

      {/* TIMELINE ROADMAP VISUAL DISPLAY */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-purple-500 before:to-neutral-800">
        {filteredEvents.map((event, index) => {
          const badge = getCategoryBadge(event.category);
          const isSelected = selectedEventId === event.id;

          return (
            <div key={event.id} className="relative group transition-all">
              {/* TIMELINE CONNECTOR NODE */}
              <div
                className={`absolute -left-6 sm:-left-8 top-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  index === 0
                    ? 'bg-amber-500 border-amber-300 ring-4 ring-amber-500/20 text-neutral-950 animate-bounce'
                    : 'bg-neutral-900 border-amber-500/60 text-amber-400'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
              </div>

              {/* EVENT CARD */}
              <div
                onClick={() => setSelectedEventId(isSelected ? null : event.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-amber-50/90 border-amber-400 shadow-lg'
                      : 'bg-neutral-900 border-amber-500/60 shadow-xl shadow-amber-500/10'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${badge.color}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-xs font-mono font-extrabold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{event.dateStr}</span>
                    </span>

                    <span
                      className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                        event.daysRemaining <= 7
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {event.daysRemaining === 0 ? 'TODAY' : `IN ${event.daysRemaining} DAYS`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-neutral-400">Impact:</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded text-[10px] ${
                        event.impactLevel === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {event.impactLevel} VOLATILITY
                    </span>
                  </div>
                </div>

                <h4 className="text-sm sm:text-base font-extrabold font-sans text-white group-hover:text-amber-400 transition-colors">
                  {event.title}
                </h4>

                <p className="text-xs text-neutral-300 font-sans leading-relaxed mt-1">
                  {event.description}
                </p>

                {/* EXPANDABLE DETAILS AREA */}
                {isSelected && event.keyDetails && (
                  <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {event.keyDetails.map((det, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                          <span className="text-[10px] text-neutral-400 block font-mono uppercase">{det.label}</span>
                          <strong className="text-xs font-bold text-amber-300 font-mono">{det.value}</strong>
                        </div>
                      ))}
                    </div>

                    {event.historicalReaction && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 font-mono">
                        <span className="flex items-center gap-1.5 font-bold">
                          <TrendingUp className="w-4 h-4" />
                          <span>Historical Stock Reaction:</span>
                        </span>
                        <span>{event.historicalReaction}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
