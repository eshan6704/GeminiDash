import { TradeRecord, Position, SpotHolding, MarketAsset, SHARK_EXCHANGE } from '../types/trading';

interface ExportReportParams {
  totalEquity: number;
  cashBalance: number;
  marginLocked: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalFeesPaid: number;
  winRate: number;
  totalTrades: number;
  goldHedgeRatio: number;
  positions: Position[];
  tradeHistory: TradeRecord[];
  spotHoldings: SpotHolding[];
  assets: Record<string, MarketAsset>;
  brokerName?: string;
}

/**
 * Cleanly escapes a string or number for standard RFC 4180 CSV
 */
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports complete trade history and performance metrics as a CSV file
 */
export function exportTradeHistoryAndMetricsCSV(params: ExportReportParams) {
  const {
    totalEquity,
    cashBalance,
    marginLocked,
    unrealizedPnL,
    realizedPnL,
    totalFeesPaid,
    winRate,
    totalTrades,
    goldHedgeRatio,
    positions,
    tradeHistory,
    spotHoldings,
    assets,
    brokerName = SHARK_EXCHANGE.name,
  } = params;

  const exportDate = new Date();
  const dateIso = exportDate.toISOString();
  const dateFormatted = exportDate.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  // Calculate allocation breakdown
  let goldNotional = 0;
  let cryptoNotional = 0;

  spotHoldings.forEach((h) => {
    const p = assets[h.symbol]?.price || h.avgCostPrice;
    const val = h.amount * p;
    if (assets[h.symbol]?.category === 'gold') goldNotional += val;
    else cryptoNotional += val;
  });

  positions.forEach((pos) => {
    const notional = pos.amount * (assets[pos.assetSymbol]?.price || pos.entryPrice);
    if (assets[pos.assetSymbol]?.category === 'gold') goldNotional += notional;
    else cryptoNotional += notional;
  });

  const lines: string[] = [];

  // ==========================================
  // SECTION 1: BROKER PROFILE & SYSTEM METADATA
  // ==========================================
  lines.push('=== SHARK EXCHANGE TRADING & PERFORMANCE AUDIT REPORT ===');
  lines.push(`Report Generated,${escapeCSV(dateFormatted)},ISO: ${escapeCSV(dateIso)}`);
  lines.push(`Broker Name,${escapeCSV(brokerName)}`);
  lines.push(`Brokerage Fee Rate,${escapeCSV('Maker 0.016% | Taker 0.064% (4x Maker rate)')}`);
  lines.push(`Margin Leverage Rules,${escapeCSV('Gold 75x | BTC 150x | Rest (SOL/ETH/etc.) 25x')}`);
  lines.push(`Standard Sizing Rules,${escapeCSV('Default Lot: 0.002 | Gold Standard: 0.1 size | BTC Standard: 0.002 lot')}`);
  lines.push('');

  // ==========================================
  // SECTION 2: PORTFOLIO PERFORMANCE METRICS
  // ==========================================
  lines.push('=== PERFORMANCE & RISK METRICS ===');
  lines.push('Metric,Value,Unit/Currency');
  lines.push(`Total Net Equity,${totalEquity.toFixed(2)},USD`);
  lines.push(`Free Cash Balance (USDT),${cashBalance.toFixed(2)},USDT`);
  lines.push(`Margin Collateral Locked,${marginLocked.toFixed(2)},USD`);
  lines.push(`Total Unrealized PnL,${unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)},USD`);
  lines.push(`Total Realized PnL,${realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)},USD`);
  lines.push(`Total Brokerage Fees Paid (0.016%),${totalFeesPaid.toFixed(4)},USD`);
  lines.push(`Total Trades Executed,${totalTrades},Trades`);
  lines.push(`Win Rate,${winRate.toFixed(2)},%`);
  lines.push(`Gold Hedge Ratio,${goldHedgeRatio.toFixed(2)},%`);
  lines.push(`Gold Exposure Notional,${goldNotional.toFixed(2)},USD`);
  lines.push(`Crypto Exposure Notional,${cryptoNotional.toFixed(2)},USD`);
  lines.push('');

  // ==========================================
  // SECTION 3: CLOSED TRADE HISTORY
  // ==========================================
  lines.push('=== CLOSED TRADE HISTORY ===');
  const historyHeaders = [
    'Trade ID',
    'Date Closed',
    'Broker',
    'Asset',
    'Side',
    'Mode',
    'Leverage',
    'Amount / Lots',
    'Entry Price ($)',
    'Exit Price ($)',
    'Trade Value / Notional ($)',
    'Gross PnL ($)',
    'Brokerage Fee (0.016%) ($)',
    'Net Realized PnL ($)',
    'Net Return (%)',
    'Exit Reason',
  ];
  lines.push(historyHeaders.map(escapeCSV).join(','));

  if (tradeHistory.length === 0) {
    lines.push(escapeCSV('No closed trades recorded yet.'));
  } else {
    tradeHistory.forEach((t) => {
      const closedDate = new Date(t.closeTime).toISOString();
      const notional = t.amount * t.entryPrice;
      const grossPnL = t.realizedPnL + t.fees;

      const row = [
        t.id,
        closedDate,
        brokerName,
        t.assetSymbol,
        t.side,
        t.mode,
        `${t.leverage}x`,
        t.amount.toFixed(4),
        t.entryPrice.toFixed(2),
        t.exitPrice.toFixed(2),
        notional.toFixed(2),
        grossPnL.toFixed(2),
        t.fees.toFixed(4),
        t.realizedPnL.toFixed(2),
        `${t.realizedPnLPercent >= 0 ? '+' : ''}${t.realizedPnLPercent.toFixed(2)}%`,
        t.closeReason,
      ];
      lines.push(row.map(escapeCSV).join(','));
    });
  }
  lines.push('');

  // ==========================================
  // SECTION 4: ACTIVE LEVERAGED POSITIONS
  // ==========================================
  lines.push('=== ACTIVE LEVERAGED POSITIONS ===');
  const positionHeaders = [
    'Position ID',
    'Open Time',
    'Broker',
    'Asset',
    'Direction',
    'Leverage',
    'Size / Lots',
    'Entry Price ($)',
    'Current Price ($)',
    'Margin Collateral ($)',
    'Notional Value ($)',
    'Unrealized PnL ($)',
    'Unrealized PnL (%)',
    'Liquidation Price ($)',
    'Take Profit Target ($)',
    'Stop Loss Price ($)',
    'Brokerage Fee Paid ($)',
  ];
  lines.push(positionHeaders.map(escapeCSV).join(','));

  if (positions.length === 0) {
    lines.push(escapeCSV('No open positions currently active.'));
  } else {
    positions.forEach((p) => {
      const curPrice = assets[p.assetSymbol]?.price || p.entryPrice;
      const notional = p.amount * curPrice;
      const openDate = new Date(p.openTime).toISOString();

      const row = [
        p.id,
        openDate,
        brokerName,
        p.assetSymbol,
        p.side,
        `${p.leverage}x`,
        p.amount.toFixed(4),
        p.entryPrice.toFixed(2),
        curPrice.toFixed(2),
        p.margin.toFixed(2),
        notional.toFixed(2),
        p.unrealizedPnL.toFixed(2),
        `${p.unrealizedPnLPercent >= 0 ? '+' : ''}${p.unrealizedPnLPercent.toFixed(2)}%`,
        p.liquidationPrice.toFixed(2),
        p.takeProfitPrice ? p.takeProfitPrice.toFixed(2) : 'None',
        p.stopLossPrice ? p.stopLossPrice.toFixed(2) : 'None',
        p.feePaid.toFixed(4),
      ];
      lines.push(row.map(escapeCSV).join(','));
    });
  }
  lines.push('');

  // ==========================================
  // SECTION 5: SPOT HOLDINGS
  // ==========================================
  lines.push('=== SPOT ASSET HOLDINGS ===');
  const spotHeaders = [
    'Asset',
    'Category',
    'Units Held',
    'Avg Cost Price ($)',
    'Current Price ($)',
    'Market Value ($)',
    'Unrealized PnL ($)',
  ];
  lines.push(spotHeaders.map(escapeCSV).join(','));

  if (spotHoldings.length === 0) {
    lines.push(escapeCSV('No spot holdings currently in wallet.'));
  } else {
    spotHoldings.forEach((s) => {
      const curPrice = assets[s.symbol]?.price || s.avgCostPrice;
      const val = s.amount * curPrice;
      const cost = s.amount * s.avgCostPrice;
      const pnl = val - cost;
      const cat = assets[s.symbol]?.category || 'crypto';

      const row = [
        s.symbol,
        cat.toUpperCase(),
        s.amount.toFixed(4),
        s.avgCostPrice.toFixed(2),
        curPrice.toFixed(2),
        val.toFixed(2),
        `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`,
      ];
      lines.push(row.map(escapeCSV).join(','));
    });
  }

  // Create CSV Blob and trigger download
  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filenameDate = dateIso.split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `SharkExchange_Trading_Report_${filenameDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
