import { Position, SpotHolding, MarketAsset } from '../types/trading';

interface PortfolioSnapshot {
  equity: number;
  cash: number;
  unrealizedPnL: number;
  positions: Position[];
  spotHoldings: SpotHolding[];
  assets: Record<string, MarketAsset>;
}

export async function analyzePortfolioRisk(snapshot: PortfolioSnapshot): Promise<string> {
  const { equity, cash, positions, spotHoldings, assets } = snapshot;

  // Calculate Gold allocation vs Crypto
  let goldVal = 0;
  let cryptoVal = 0;

  // Spot valuation
  spotHoldings.forEach((h) => {
    const asset = assets[h.symbol];
    if (asset) {
      const val = h.amount * asset.price;
      if (asset.category === 'gold') goldVal += val;
      else cryptoVal += val;
    }
  });

  // Leveraged positions valuation
  positions.forEach((p) => {
    const asset = assets[p.assetSymbol];
    if (asset) {
      const notional = p.amount * asset.price;
      if (asset.category === 'gold') goldVal += notional;
      else cryptoVal += notional;
    }
  });

  const totalNotional = goldVal + cryptoVal + cash;
  const goldRatio = totalNotional > 0 ? (goldVal / totalNotional) * 100 : 0;
  const cryptoRatio = totalNotional > 0 ? (cryptoVal / totalNotional) * 100 : 0;
  const maxLeverage = positions.length > 0 ? Math.max(...positions.map((p) => p.leverage)) : 1;

  try {
    const res = await fetch('/api/gemini/risk-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goldRatio,
        cryptoRatio,
        positions: positions.map((p) => ({
          assetSymbol: p.assetSymbol,
          leverage: p.leverage,
          side: p.side,
          entryPrice: p.entryPrice,
          currentPrice: assets[p.assetSymbol]?.price || p.entryPrice,
          liquidationPrice: p.liquidationPrice,
          unrealizedPnL: p.unrealizedPnL,
          unrealizedPnLPercent: p.unrealizedPnLPercent,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analysis) {
        return data.analysis;
      }
    }
  } catch {
    // Fallback to quantitative rule-based risk engine below
  }

  // Quantitative Rule-Based Risk Engine Fallback
  let riskScore = 3;
  if (maxLeverage >= 20) riskScore += 4;
  else if (maxLeverage >= 10) riskScore += 2;
  else if (maxLeverage >= 5) riskScore += 1;

  if (cryptoRatio > 70) riskScore += 2;
  if (goldRatio >= 25) riskScore = Math.max(1, riskScore - 2);

  const riskLevel = riskScore >= 8 ? 'HIGH RISK ⚠️' : riskScore >= 5 ? 'MODERATE RISK ⚡' : 'BALANCED / DEFENSIVE 🛡️';

  const positionNotes = positions.map((p) => {
    const curPrice = assets[p.assetSymbol]?.price || p.entryPrice;
    const distanceToLiq = Math.abs((p.liquidationPrice - curPrice) / curPrice) * 100;
    return `• **${p.assetSymbol} (${p.leverage}x ${p.side})**: ${distanceToLiq.toFixed(1)}% buffer before liquidation ($${p.liquidationPrice.toFixed(2)}). Current PnL: ${p.unrealizedPnL >= 0 ? '+' : ''}$${p.unrealizedPnL.toFixed(2)}.`;
  });

  return `### Portfolio Health: ${riskLevel} (Score: ${riskScore}/10)

**1. Allocation & Gold Hedge Ratio:**
• **Gold (XAUT/PAXG)**: ${goldRatio.toFixed(1)}% | **Crypto**: ${cryptoRatio.toFixed(1)}% | **Cash**: ${((cash / (equity || 1)) * 100).toFixed(1)}%
• ${goldRatio > 20 
    ? '✅ Healthy Gold allocation: Tether Gold provides real physical asset stability against systemic crypto volatility.' 
    : '⚠️ Low Gold hedge: Consider allocating 15-30% into XAUT to absorb downside crypto shocks.'}

**2. Margin & Liquidation Buffer:**
${positionNotes.length > 0 ? positionNotes.join('\n') : '• No active leveraged positions. All capital is preserved in cash/spot holdings.'}

**3. Real-World Execution Advice:**
• **Fee Awareness**: High leverage scalping incurs significant taker fees (${(snapshot.positions.reduce((acc, p) => acc + p.feePaid, 0)).toFixed(2)} USDT so far).
• **Macro Correlation**: In real market flash crashes, XAUT maintains a low beta to Bitcoin. Keep stop-losses tight on high-beta crypto pairs.`;
}
