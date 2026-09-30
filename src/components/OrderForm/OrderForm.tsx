import React, { useState, useMemo, useEffect } from 'react';
import {
  MarketAsset,
  TradeMode,
  OrderSide,
  OrderType,
  SimulatorConfig,
  SHARK_EXCHANGE,
  getBrokerMaxLeverage,
  getBrokerDefaultSize,
} from '../../types/trading';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  DollarSign,
  Percent,
  Sliders,
  Shield,
  HelpCircle,
  Building2,
  Coins,
  Bell,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { Position } from '../../types/trading';
import { usePriceAlerts } from '../../hooks/usePriceAlerts';
import { useAutoGridTrader } from '../../hooks/useAutoGridTrader';
import { PriceAlertsPanel } from './PriceAlertsPanel';
import { AutoGridPanel } from '../AutoGrid/AutoGridPanel';
import { TradeSlotLadderWidget } from './TradeSlotLadderWidget';
import { MAX_RUNNING_TRADES } from '../../utils/tradeEntryConditions';
import { useTheme } from '../../context/ThemeContext';
import { useInrCurrency, InrCurrencyToggle } from '../../utils/inrCurrency';

interface OrderFormProps {
  asset: MarketAsset;
  cashBalance: number;
  config: SimulatorConfig;
  spotBalanceAmount: number;
  allAssets?: Record<string, MarketAsset>;
  positions?: Position[];
  initialTab?: 'TRADE' | 'AUTOGRID' | 'ALERTS';
  hideTabSwitcher?: boolean;
  onOpenWhatIf?: () => void;
  onClosePosition?: (positionId: string, percentage?: number) => void;
  onUpdateSLTP?: (positionId: string, stopLoss?: number, takeProfit?: number, trailingStopPercent?: number) => void;
  onNotify?: (type: 'success' | 'info' | 'warning' | 'danger', title: string, message: string) => void;
  onUpdateManualBalance?: (newBalance: number) => void;
  gridCashBalance?: number;
  gridMarginLocked?: number;
  gridUnrealizedPnL?: number;
  gridTotalEquity?: number;
  onUpdateGridBalance?: (newBalance: number) => void;
  onResetGridSimulation?: (newBalance?: number) => void;
  onPlaceOrder: (params: {
    symbol: string;
    mode: TradeMode;
    side: OrderSide;
    orderType: OrderType;
    margin: number;
    leverage: number;
    amount?: number;
    isMaker?: boolean;
    customSymbolPrice?: number;
    targetPrice?: number;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    trailingStopPercent?: number;
    liqDollarCap?: number;
    accountSource?: 'MANUAL' | 'AUTO_GRID';
  }) => boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  asset,
  cashBalance,
  config,
  spotBalanceAmount,
  allAssets,
  positions = [],
  initialTab = 'TRADE',
  hideTabSwitcher = false,
  onOpenWhatIf,
  onClosePosition = () => {},
  onUpdateSLTP = () => {},
  onNotify,
  onUpdateManualBalance,
  gridCashBalance,
  gridMarginLocked,
  gridUnrealizedPnL,
  gridTotalEquity,
  onUpdateGridBalance,
  onResetGridSimulation,
  onPlaceOrder,
}) => {
  const [terminalTab, setTerminalTab] = useState<'TRADE' | 'AUTOGRID' | 'ALERTS'>(initialTab);
  const [manualBalEditInput, setManualBalEditInput] = useState<string>(cashBalance.toFixed(0));
  const { showInr, formatInr } = useInrCurrency();

  useEffect(() => {
    setManualBalEditInput(cashBalance.toFixed(0));
  }, [cashBalance]);

  useEffect(() => {
    setTerminalTab(initialTab);
  }, [initialTab]);
  const alertEngine = usePriceAlerts(asset, allAssets, onNotify);
  const effectiveGridCash = gridCashBalance !== undefined ? gridCashBalance : cashBalance;
  const autoGrid = useAutoGridTrader(
    asset,
    positions,
    effectiveGridCash,
    config,
    onPlaceOrder,
    onClosePosition,
    onUpdateSLTP,
    onNotify
  );

  const [mode, setMode] = useState<TradeMode>('LEVERAGED');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [feeTier, setFeeTier] = useState<'MAKER' | 'TAKER'>('MAKER');
  const [customSymbolPriceInput, setCustomSymbolPriceInput] = useState<string>('');
  const [previewExitPriceInput, setPreviewExitPriceInput] = useState<string>('');

  // Shark Exchange broker rules
  const maxLeverage = asset?.symbol ? getBrokerMaxLeverage(asset.symbol) : 150;
  const defaultSize = asset?.symbol ? getBrokerDefaultSize(asset.symbol) : 0.002;

  // Sizing mode: By Lot Size vs By Margin (USDT)
  const [sizingMode, setSizingMode] = useState<'LOT' | 'MARGIN'>('LOT');
  const [lotInput, setLotInput] = useState<string>(defaultSize.toString());
  const [leverage, setLeverage] = useState<number>(() => {
    // Default initial leverage: 150x for BTC/crypto, 75x for Gold
    if (asset?.category === 'gold') return 75;
    return 150;
  });

  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [slDollarCapInput, setSlDollarCapInput] = useState<string>('3'); // Default $3 on BTC (0.002 lot = 1500 pts)
  const [enableTP, setEnableTP] = useState<boolean>(false);
  const [tpPriceInput, setTpPriceInput] = useState<string>('');
  const [enableSL, setEnableSL] = useState<boolean>(false);
  const [slPriceInput, setSlPriceInput] = useState<string>('');
  const [trailingStopInput, setTrailingStopInput] = useState<string>('');

  // A local stablePrice variable in the UI components that defaults to the previous valid price if no update has arrived
  const lastValidPriceRef = React.useRef<number>(asset.price || 0);
  if (asset.price && typeof asset.price === 'number' && asset.price > 0) {
    lastValidPriceRef.current = asset.price;
  }
  const stablePrice = lastValidPriceRef.current;

  const currentPrice = stablePrice;

  // Custom symbol price override (e.g. 80000) or limit target price or live market price
  const parsedCustomPrice = parseFloat(customSymbolPriceInput);
  const effectiveTargetPrice =
    !isNaN(parsedCustomPrice) && parsedCustomPrice > 0
      ? parsedCustomPrice
      : orderType === 'LIMIT'
      ? parseFloat(targetPriceInput) || currentPrice
      : currentPrice;

  // Real-world slippage calculation (disabled by default so Trade Value = Price * Lot is exact)
  const slippageEstimate = useMemo(() => {
    if (!config.enableSlippage || orderType === 'LIMIT' || (!isNaN(parsedCustomPrice) && parsedCustomPrice > 0)) {
      return 0;
    }
    return effectiveTargetPrice * config.slippageRate;
  }, [config.enableSlippage, config.slippageRate, orderType, effectiveTargetPrice, parsedCustomPrice]);

  const execPrice =
    side === 'BUY'
      ? effectiveTargetPrice + slippageEstimate
      : effectiveTargetPrice - slippageEstimate;

  const effectiveLeverage = mode === 'SPOT' ? 1 : leverage;

  // Formula:
  // Trade value = symbolPrice * lot
  // Margin required = tradeValue / leverage
  const [marginInput, setMarginInput] = useState<string>(() => {
    if (!asset) return '1.07';
    const lev = asset.category === 'gold' ? 75 : 150;
    const initialTradeVal = defaultSize * (asset.price || 80000);
    return (initialTradeVal / lev).toFixed(4);
  });

  // When asset or trade mode changes, synchronize lot and margin
  useEffect(() => {
    if (!asset?.symbol) return;
    const assetDefault = getBrokerDefaultSize(asset.symbol);
    setLotInput(assetDefault.toString());
    setCustomSymbolPriceInput('');
    setPreviewExitPriceInput('');

    const assetMaxLev = getBrokerMaxLeverage(asset.symbol);
    const defaultLev = asset.category === 'gold' ? 75 : 150;
    const nextLev = mode === 'SPOT' ? 1 : Math.min(defaultLev, assetMaxLev);
    setLeverage(nextLev);

    if (execPrice > 0) {
      const tradeVal = assetDefault * execPrice;
      const calcMargin = tradeVal / nextLev;
      setMarginInput(calcMargin.toFixed(4));
    }
  }, [asset.symbol, mode]);

  // Handle Lot Input changes -> Trade Value = price * lot -> Margin Required = Trade Value / leverage
  const handleLotChange = (val: string) => {
    setLotInput(val);
    const numLots = parseFloat(val) || 0;
    if (execPrice > 0 && effectiveLeverage > 0) {
      const tradeVal = numLots * execPrice;
      const requiredMargin = tradeVal / effectiveLeverage;
      setMarginInput(requiredMargin.toFixed(4));
    }
  };

  // Handle Margin Input changes -> Trade Value = margin * leverage -> Lot = Trade Value / price
  const handleMarginChange = (val: string) => {
    setMarginInput(val);
    const numMargin = parseFloat(val) || 0;
    if (execPrice > 0 && effectiveLeverage > 0) {
      const tradeVal = numMargin * effectiveLeverage;
      const computedLots = tradeVal / execPrice;
      setLotInput(computedLots.toFixed(4));
    }
  };

  // Handle Leverage changes -> Margin Required = (price * lot) / newLeverage
  const handleLeverageChange = (newLev: number) => {
    const clampedLev = Math.max(1, Math.min(newLev, maxLeverage));
    setLeverage(clampedLev);
    if (sizingMode === 'LOT') {
      const numLots = parseFloat(lotInput) || 0;
      if (execPrice > 0 && clampedLev > 0) {
        const tradeVal = numLots * execPrice;
        const requiredMargin = tradeVal / clampedLev;
        setMarginInput(requiredMargin.toFixed(4));
      }
    } else {
      const numMargin = parseFloat(marginInput) || 0;
      if (execPrice > 0 && clampedLev > 0) {
        const tradeVal = numMargin * clampedLev;
        const computedLots = tradeVal / execPrice;
        setLotInput(computedLots.toFixed(4));
      }
    }
  };

  const assetUnits = sizingMode === 'LOT'
    ? (parseFloat(lotInput) || 0)
    : (execPrice > 0 ? ((parseFloat(marginInput) || 0) * effectiveLeverage) / execPrice : 0);

  // Exact formula:
  // Trade value = symbolPrice * lot
  const tradeValue = execPrice * assetUnits;

  // Margin required = tradeValue / leverage
  const numericMargin = sizingMode === 'MARGIN'
    ? (parseFloat(marginInput) || 0)
    : (effectiveLeverage > 0 ? tradeValue / effectiveLeverage : 0);

  // Fees = tradeValue * 0.016% if Maker order (Taker has 4x brokerage = 0.064%)
  const isMakerOrder = feeTier === 'MAKER';
  const makerFeeRate = SHARK_EXCHANGE.makerBrokerageRateDecimal; // 0.00016 (0.016%)
  const takerFeeRate = SHARK_EXCHANGE.takerBrokerageRateDecimal; // 0.00064 (0.064% = 4x maker)
  const makerFee = config.enableFees ? tradeValue * makerFeeRate : 0;
  const takerFee = config.enableFees ? tradeValue * takerFeeRate : 0;
  const estimatedFee = isMakerOrder ? makerFee : takerFee;

  // Return = Change in Trade Value (Exit Trade Value - Entry Trade Value for BUY, Entry - Exit for SELL)
  const effectiveExitPreviewPrice = useMemo(() => {
    const manualExit = parseFloat(previewExitPriceInput);
    if (!isNaN(manualExit) && manualExit > 0) return manualExit;
    const tpExit = parseFloat(tpPriceInput);
    if (enableTP && !isNaN(tpExit) && tpExit > 0) return tpExit;
    // Default +1% (or +$1,000 on BTC) target preview so Return formula is always visible
    return side === 'BUY' ? execPrice * 1.01 : execPrice * 0.99;
  }, [previewExitPriceInput, tpPriceInput, enableTP, side, execPrice]);

  const exitTradeValue = effectiveExitPreviewPrice * assetUnits;
  const tradeValueDiff = side === 'BUY'
    ? exitTradeValue - tradeValue
    : tradeValue - exitTradeValue;
  const estimatedReturn = tradeValueDiff;
  const estimatedReturnRoePct = numericMargin > 0 ? (estimatedReturn / numericMargin) * 100 : 0;

  // Contract Size (Lot) Based Liquidation & Stop-Loss Calculation:
  // $3 on BTC:
  // 1 lot     -> 3 / 1     = 3 points
  // 0.1 lot   -> 3 / 0.1   = 30 points
  // 0.01 lot  -> 3 / 0.01  = 300 points
  // 0.002 lot -> 3 / 0.002 = 1500 points (Buy @ 80000 -> 78500 SL/Liq)
  const effectiveLiqDollarCap = Math.max(0.01, parseFloat(slDollarCapInput) || 3);
  const liqPointsDistance = useMemo(() => {
    if (assetUnits <= 0) return 0;
    return effectiveLiqDollarCap / assetUnits;
  }, [effectiveLiqDollarCap, assetUnits]);

  const liquidationPrice = useMemo(() => {
    if (mode === 'SPOT' || assetUnits <= 0) return 0;
    if (side === 'BUY') {
      return Math.max(0, execPrice - liqPointsDistance);
    } else {
      return execPrice + liqPointsDistance;
    }
  }, [mode, side, execPrice, assetUnits, liqPointsDistance]);

  const distanceToLiqPct = useMemo(() => {
    if (liquidationPrice <= 0 || execPrice <= 0) return 0;
    return Math.abs((liquidationPrice - execPrice) / execPrice) * 100;
  }, [liquidationPrice, execPrice]);

  // Synchronize default SL price with lot-based points ($3 / lotSize) when lot, side, or price changes
  useEffect(() => {
    if (assetUnits > 0 && execPrice > 0) {
      const pts = effectiveLiqDollarCap / assetUnits;
      const computedSl = side === 'BUY' ? Math.max(0, execPrice - pts) : execPrice + pts;
      setSlPriceInput(computedSl.toFixed(2));
    }
  }, [assetUnits, side, execPrice, effectiveLiqDollarCap]);

  const handleQuickPercent = (pct: number) => {
    if (mode === 'SPOT' && side === 'SELL') {
      const maxSpotVal = spotBalanceAmount * currentPrice;
      const amt = (maxSpotVal * pct) / 100;
      setMarginInput(amt.toFixed(2));
      if (execPrice > 0) {
        setLotInput((amt / execPrice).toFixed(4));
      }
    } else {
      const maxSafe = Math.max(0, cashBalance * 0.998);
      const amt = (maxSafe * pct) / 100;
      setMarginInput(amt.toFixed(2));
      if (execPrice > 0 && effectiveLeverage > 0) {
        setLotInput(((amt * effectiveLeverage) / execPrice).toFixed(4));
      }
    }
  };

  const applyPresetLot = (lots: number) => {
    setSizingMode('LOT');
    setLotInput(lots.toString());
    if (execPrice > 0 && effectiveLeverage > 0) {
      const requiredMargin = (lots * execPrice) / effectiveLeverage;
      setMarginInput(requiredMargin.toFixed(4));
    }
  };

  const applyPresetTPSL = (tpPct: number, slPct: number) => {
    setEnableTP(true);
    setEnableSL(true);
    if (side === 'BUY') {
      setTpPriceInput((execPrice * (1 + tpPct / 100)).toFixed(2));
      setSlPriceInput((execPrice * (1 - slPct / 100)).toFixed(2));
    } else {
      setTpPriceInput((execPrice * (1 - tpPct / 100)).toFixed(2));
      setSlPriceInput((execPrice * (1 + slPct / 100)).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericMargin <= 0 || assetUnits <= 0 || !asset?.symbol) return;

    onPlaceOrder({
      symbol: asset.symbol,
      mode,
      side,
      orderType,
      margin: numericMargin,
      leverage: effectiveLeverage,
      amount: assetUnits,
      isMaker: isMakerOrder,
      customSymbolPrice: !isNaN(parsedCustomPrice) && parsedCustomPrice > 0 ? parsedCustomPrice : undefined,
      targetPrice: orderType === 'LIMIT' ? (parseFloat(targetPriceInput) || execPrice) : undefined,
      takeProfitPrice: enableTP && tpPriceInput ? parseFloat(tpPriceInput) : undefined,
      stopLossPrice: enableSL && slPriceInput ? parseFloat(slPriceInput) : undefined,
      trailingStopPercent: trailingStopInput ? parseFloat(trailingStopInput) : undefined,
      liqDollarCap: effectiveLiqDollarCap,
    });
  };

  const isGold = asset?.category === 'gold';
  const isBtc = asset?.symbol === 'BTC';

  if (!asset) return null;

  if (hideTabSwitcher && terminalTab === 'AUTOGRID') {
    return (
      <AutoGridPanel
        asset={asset}
        cashBalance={effectiveGridCash}
        gridMarginLocked={gridMarginLocked}
        gridUnrealizedPnL={gridUnrealizedPnL}
        gridTotalEquity={gridTotalEquity}
        onUpdateGridBalance={onUpdateGridBalance}
        onResetGridSimulation={onResetGridSimulation}
        config={config}
        gridConfig={autoGrid.gridConfig}
        runtime={autoGrid.runtime}
        gridLadder={autoGrid.gridLadder}
        downsideLadder={autoGrid.downsideLadder}
        positions={positions}
        onOpenWhatIf={onOpenWhatIf}
        onStartBot={autoGrid.startBot}
        onPauseBot={autoGrid.pauseBot}
        onResumeBot={autoGrid.resumeBot}
        onStopBot={autoGrid.stopBot}
        onResetBot={autoGrid.resetBot}
        onUpdateConfig={autoGrid.updateConfig}
        onApplyGoldPreset={autoGrid.applyGoldPreset}
        onApplyBtcPreset={autoGrid.applyBtcPreset}
        onClearLogs={autoGrid.clearLogs}
        onRefreshTrends={autoGrid.refreshCandleTrends}
      />
    );
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col space-y-3 border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] shadow-sm"
    >
      {/* Terminal View Switcher */}
      {!hideTabSwitcher && (
        <div
          className="flex p-1 rounded-sm border gap-1 bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]"
        >
          {[ 
            { id: 'TRADE', label: 'Direct Trade' },
            { id: 'AUTOGRID', label: 'Auto Grid', icon: <Sparkles className="w-3 h-3" /> },
            { id: 'ALERTS', label: 'Alerts', icon: <Bell className="w-3 h-3" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTerminalTab(tab.id as any)}
              className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-sm transition-all flex items-center justify-center gap-2 border border-transparent ${
                terminalTab === tab.id
                  ? 'bg-[var(--theme-border)] text-emerald-500 border-[var(--theme-border-subtle)]'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Render Selected View */}
      {terminalTab === 'AUTOGRID' ? (
        <AutoGridPanel
          asset={asset}
          cashBalance={effectiveGridCash}
          gridMarginLocked={gridMarginLocked}
          gridUnrealizedPnL={gridUnrealizedPnL}
          gridTotalEquity={gridTotalEquity}
          onUpdateGridBalance={onUpdateGridBalance}
          onResetGridSimulation={onResetGridSimulation}
          config={config}
          gridConfig={autoGrid.gridConfig}
          runtime={autoGrid.runtime}
          gridLadder={autoGrid.gridLadder}
          downsideLadder={autoGrid.downsideLadder}
          positions={positions}
          onOpenWhatIf={onOpenWhatIf}
          onStartBot={autoGrid.startBot}
          onPauseBot={autoGrid.pauseBot}
          onResumeBot={autoGrid.resumeBot}
          onStopBot={autoGrid.stopBot}
          onResetBot={autoGrid.resetBot}
          onUpdateConfig={autoGrid.updateConfig}
          onApplyGoldPreset={autoGrid.applyGoldPreset}
          onApplyBtcPreset={autoGrid.applyBtcPreset}
          onClearLogs={autoGrid.clearLogs}
          onRefreshTrends={autoGrid.refreshCandleTrends}
        />
      ) : terminalTab === 'ALERTS' ? (
        <PriceAlertsPanel
          asset={asset}
          alertEngine={alertEngine}
          onFillLimitPrice={(price) => {
            setOrderType('LIMIT');
            setTargetPriceInput(price.toString());
            setTerminalTab('TRADE');
          }}
          onClose={() => setTerminalTab('TRADE')}
        />
      ) : (
        <form noValidate onSubmit={handleSubmit} className="w-full space-y-2.5">
          {/* Manual Trade Simulator Top Bar with INR Currency Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--theme-text-primary)]">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manual Trade &amp; Return Simulator ({asset.symbol}/USDT)</span>
            </div>
            <InrCurrencyToggle />
          </div>

          {/* Minimal 3-Column Manual Trade Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
            
            {/* COLUMN 1: Side, Order Type, Fee Tier & Price */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex p-0.5 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LEVERAGED');
                      if (leverage === 1) setLeverage(isBtc ? 150 : isGold ? 25 : 10);
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${
                      mode === 'LEVERAGED'
                        ? 'bg-[var(--theme-border)] text-amber-400'
                        : 'text-[var(--theme-text-muted)]'
                    }`}
                  >
                    Futures
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SPOT');
                      setLeverage(1);
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${
                      mode === 'SPOT'
                        ? 'bg-[var(--theme-border)] text-emerald-400'
                        : 'text-[var(--theme-text-muted)]'
                    }`}
                  >
                    Spot
                  </button>
                </div>

                <div className="flex p-0.5 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                      orderType === 'MARKET'
                        ? 'bg-[var(--theme-border)] text-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-muted)]'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('LIMIT');
                      setFeeTier('MAKER');
                      if (!targetPriceInput) setTargetPriceInput(currentPrice.toString());
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                      orderType === 'LIMIT'
                        ? 'bg-[var(--theme-border)] text-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-muted)]'
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Buy/Long vs Sell/Short */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all border ${
                    side === 'BUY'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border-subtle)]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {mode === 'SPOT' ? 'Buy' : 'Long'}
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all border ${
                    side === 'SELL'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border-subtle)]'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  {mode === 'SPOT' ? 'Sell' : 'Short'}
                </button>
              </div>

              {/* Symbol Price Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <label className="text-[var(--theme-text-muted)]">Price ($)</label>
                  <div className="flex items-center gap-1 font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSymbolPriceInput('80000');
                        setLotInput('0.002');
                        setLeverage(150);
                        setSizingMode('LOT');
                        setMarginInput(((80000 * 0.002) / 150).toFixed(4));
                        setSlDollarCapInput('3');
                        setEnableSL(false);
                        const slPts = 3 / 0.002;
                        setSlPriceInput((side === 'BUY' ? 80000 - slPts : 80000 + slPts).toFixed(2));
                      }}
                      className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px]"
                    >
                      80k · 0.002 · 150x
                    </button>
                    {customSymbolPriceInput && (
                      <button
                        type="button"
                        onClick={() => setCustomSymbolPriceInput('')}
                        className="px-1.5 py-0.5 rounded border border-[var(--theme-border)] text-emerald-400 text-[9px]"
                      >
                        Live
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  value={customSymbolPriceInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomSymbolPriceInput(val);
                    const p = parseFloat(val) || currentPrice;
                    const lots = parseFloat(lotInput) || 0;
                    if (p > 0 && effectiveLeverage > 0 && sizingMode === 'LOT') {
                      setMarginInput(((p * lots) / effectiveLeverage).toFixed(4));
                    }
                  }}
                  placeholder={`Live: ${currentPrice.toFixed(2)}`}
                  className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded px-2.5 py-1.5 font-mono text-xs text-[var(--theme-text-primary)]"
                />
              </div>

              {orderType === 'LIMIT' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--theme-text-muted)] block">
                    Limit Target Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    placeholder={currentPrice.toString()}
                    className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded px-2.5 py-1.5 font-mono text-xs text-[var(--theme-text-primary)]"
                    required
                  />
                </div>
              )}
            </div>

            {/* COLUMN 2: Lot Size, Leverage & Optional Risk */}
            <div className="space-y-2.5">
              {/* Lot Size Input + Quick Lot Presets */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-sans font-bold text-[var(--theme-text-secondary)]">
                    Lot Size ({asset.symbol})
                  </span>
                  <div className="flex items-center gap-1">
                    {[0.002, 0.01, 0.1, 1].map((lots) => (
                      <button
                        key={lots}
                        type="button"
                        onClick={() => applyPresetLot(lots)}
                        className={`px-1.5 py-0.5 rounded text-[9px] border ${
                          parseFloat(lotInput) === lots
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
                            : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)]'
                        }`}
                      >
                        {lots}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={lotInput}
                  onFocus={() => setSizingMode('LOT')}
                  onChange={(e) => {
                    setSizingMode('LOT');
                    handleLotChange(e.target.value);
                  }}
                  className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded px-2.5 py-1.5 font-mono text-xs text-[var(--theme-text-primary)]"
                  placeholder={defaultSize.toString()}
                />
              </div>

              {/* Leverage Presets */}
              {mode === 'LEVERAGED' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[var(--theme-text-muted)]">Leverage</span>
                    <span className="font-mono text-amber-400">{leverage}x</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[10, 25, 50, 100, 150].map((levPreset) => (
                      <button
                        key={levPreset}
                        type="button"
                        onClick={() => handleLeverageChange(levPreset)}
                        className={`py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                          leverage === levPreset
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                            : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)]'
                        }`}
                      >
                        {levPreset}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact TP / SL Row */}
              {mode === 'LEVERAGED' && (
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="text-[10px] text-[var(--theme-text-muted)] font-bold block mb-1">
                      Take Profit ($)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      value={tpPriceInput}
                      onChange={(e) => {
                        setTpPriceInput(e.target.value);
                        setEnableTP(Boolean(e.target.value));
                      }}
                      className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded px-2 py-1 font-mono text-xs text-[var(--theme-text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--theme-text-muted)] font-bold flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={enableSL}
                          onChange={(e) => setEnableSL(e.target.checked)}
                          className="accent-rose-500 cursor-pointer"
                        />
                        <span>SL Auto-Close</span>
                      </span>
                      <span className="font-mono text-rose-400 text-[9px]">
                        ${effectiveLiqDollarCap}
                        {showInr ? ` (${formatInr(effectiveLiqDollarCap)})` : ''}
                      </span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      value={slPriceInput}
                      onChange={(e) => setSlPriceInput(e.target.value)}
                      className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded px-2 py-1 font-mono text-xs text-[var(--theme-text-primary)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 3: Minimal Summary & Execute */}
            <div className="space-y-2.5">
              <div className="p-2.5 rounded border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-xs font-mono space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--theme-text-muted)]">Entry &rarr; Cur/Target:</span>
                  <span className="font-bold text-[var(--theme-text-primary)]">
                    ${execPrice.toFixed(2)} &rarr; ${effectiveExitPreviewPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[var(--theme-text-muted)]">Trade Val (Entry &rarr; Target):</span>
                  <div className="text-right">
                    <span className="font-bold text-[var(--theme-text-primary)] block">
                      ${tradeValue.toFixed(2)} &rarr; ${exitTradeValue.toFixed(2)}
                    </span>
                    {showInr && (
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        {formatInr(tradeValue)} &rarr; {formatInr(exitTradeValue)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[var(--theme-text-muted)]">Return (&Delta; Price &times; Lot):</span>
                  <div className="text-right">
                    <span
                      className={`font-extrabold block ${
                        estimatedReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {estimatedReturn >= 0 ? '+' : ''}${estimatedReturn.toFixed(4)} (
                      {estimatedReturnRoePct >= 0 ? '+' : ''}
                      {estimatedReturnRoePct.toFixed(1)}%)
                    </span>
                    {showInr && (
                      <span
                        className={`text-[10px] font-bold block ${
                          estimatedReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatInr(estimatedReturn, { signed: true })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[var(--theme-text-muted)]">Margin ({effectiveLeverage}x):</span>
                  <div className="text-right">
                    <span className="font-bold text-amber-500 block">${numericMargin.toFixed(4)}</span>
                    {showInr && (
                      <span className="text-[10px] font-bold text-amber-600 block">
                        {formatInr(numericMargin)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[var(--theme-text-muted)]">Fee:</span>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFeeTier(feeTier === 'MAKER' ? 'TAKER' : 'MAKER')}
                        className="text-[10px] underline text-emerald-500 cursor-pointer"
                      >
                        {isMakerOrder ? 'Maker 0.016%' : 'Taker 0.064%'}
                      </button>
                      <span className="font-bold">${estimatedFee.toFixed(4)}</span>
                    </div>
                    {showInr && (
                      <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] block">
                        {formatInr(estimatedFee)} &middot; Net Return: {formatInr(estimatedReturn - estimatedFee, { signed: true })}
                      </span>
                    )}
                  </div>
                </div>
                {mode === 'LEVERAGED' && (
                  <div className="flex justify-between pt-1 border-t border-[var(--theme-border-subtle)]">
                    <span className="text-[var(--theme-text-muted)]">Liq. Price ({liqPointsDistance.toFixed(0)} pt):</span>
                    <span className="font-bold text-orange-500">${liquidationPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {mode === 'LEVERAGED' && (
                <TradeSlotLadderWidget positions={positions} />
              )}

              {(() => {
                const isMaxTrades = mode === 'LEVERAGED' && positions.length >= MAX_RUNNING_TRADES;
                return (
                  <button
                    type="submit"
                    disabled={
                      numericMargin <= 0 ||
                      isMaxTrades ||
                      (mode === 'SPOT' && side === 'SELL' && spotBalanceAmount <= 0)
                    }
                    className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer ${
                      isMaxTrades
                        ? 'bg-[var(--theme-border)] text-[var(--theme-text-muted)]'
                        : side === 'BUY'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {isMaxTrades ? 'Max 10 Trades Reached' : `${side === 'BUY' ? 'Buy / Long' : 'Sell / Short'} ${asset.symbol}`}
                  </button>
                );
              })()}
            </div>

          </div>
        </form>
      )}
    </div>
  );
};
