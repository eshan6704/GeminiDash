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
import { MiniMarketDepth } from './MiniMarketDepth';
import { MAX_RUNNING_TRADES } from '../../utils/tradeEntryConditions';
import { useTheme } from '../../context/ThemeContext';

interface OrderFormProps {
  asset: MarketAsset;
  cashBalance: number;
  config: SimulatorConfig;
  spotBalanceAmount: number;
  allAssets?: Record<string, MarketAsset>;
  positions?: Position[];
  onOpenWhatIf?: () => void;
  onClosePosition?: (positionId: string, percentage?: number) => void;
  onUpdateSLTP?: (positionId: string, stopLoss?: number, takeProfit?: number, trailingStopPercent?: number) => void;
  onNotify?: (type: 'success' | 'info' | 'warning' | 'danger', title: string, message: string) => void;
  onPlaceOrder: (params: {
    symbol: string;
    mode: TradeMode;
    side: OrderSide;
    orderType: OrderType;
    margin: number;
    leverage: number;
    targetPrice?: number;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    trailingStopPercent?: number;
  }) => boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  asset,
  cashBalance,
  config,
  spotBalanceAmount,
  allAssets,
  positions = [],
  onOpenWhatIf,
  onClosePosition = () => {},
  onUpdateSLTP = () => {},
  onNotify,
  onPlaceOrder,
}) => {
  const [terminalTab, setTerminalTab] = useState<'TRADE' | 'AUTOGRID' | 'ALERTS'>('TRADE');
  const alertEngine = usePriceAlerts(asset, allAssets, onNotify);
  const autoGrid = useAutoGridTrader(
    asset,
    positions,
    cashBalance,
    config,
    onPlaceOrder,
    onClosePosition,
    onUpdateSLTP,
    onNotify
  );

  const [mode, setMode] = useState<TradeMode>('LEVERAGED');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  
  // Shark Exchange broker rules
  const maxLeverage = getBrokerMaxLeverage(asset.symbol);
  const defaultSize = getBrokerDefaultSize(asset.symbol);

  // Sizing mode: By Lot Size vs By Margin (USDT)
  const [sizingMode, setSizingMode] = useState<'LOT' | 'MARGIN'>('LOT');
  const [lotInput, setLotInput] = useState<string>(defaultSize.toString());
  const [leverage, setLeverage] = useState<number>(() => {
    // Default initial leverage based on asset rules
    if (asset.symbol === 'BTC') return 50;
    if (asset.category === 'gold') return 25;
    return 10;
  });

  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
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

  // Sync default target price when switching to limit
  const effectiveTargetPrice =
    orderType === 'LIMIT'
      ? parseFloat(targetPriceInput) || currentPrice
      : currentPrice;

  // Real-world slippage calculation
  const slippageEstimate = useMemo(() => {
    if (!config.enableSlippage || orderType === 'LIMIT') return 0;
    return effectiveTargetPrice * config.slippageRate;
  }, [config.enableSlippage, config.slippageRate, orderType, effectiveTargetPrice]);

  const execPrice =
    side === 'BUY'
      ? effectiveTargetPrice + slippageEstimate
      : effectiveTargetPrice - slippageEstimate;

  const effectiveLeverage = mode === 'SPOT' ? 1 : leverage;

  // Margin on tradevalue = price * qty purchase
  // Initial margin calculated directly from (price * defaultQty) / leverage
  const [marginInput, setMarginInput] = useState<string>(() => {
    const lev = asset.symbol === 'BTC' ? 50 : asset.category === 'gold' ? 25 : 10;
    const initialTradeVal = defaultSize * asset.price;
    return (initialTradeVal / lev).toFixed(2);
  });

  // When asset or trade mode changes, synchronize lot and margin
  useEffect(() => {
    const assetDefault = getBrokerDefaultSize(asset.symbol);
    setLotInput(assetDefault.toString());

    const assetMaxLev = getBrokerMaxLeverage(asset.symbol);
    setLeverage((prev) => Math.min(prev, assetMaxLev));

    if (execPrice > 0) {
      const activeLev = mode === 'SPOT' ? 1 : Math.min(leverage, assetMaxLev);
      const tradeVal = assetDefault * execPrice;
      const calcMargin = tradeVal / activeLev;
      setMarginInput(calcMargin.toFixed(2));
    }
  }, [asset.symbol, mode]);

  // Handle Lot Input changes -> Trade Value = price * qty purchase -> Margin = Trade Value / leverage
  const handleLotChange = (val: string) => {
    setLotInput(val);
    const numLots = parseFloat(val) || 0;
    if (execPrice > 0 && effectiveLeverage > 0) {
      const tradeVal = numLots * execPrice;
      const requiredMargin = tradeVal / effectiveLeverage;
      setMarginInput(requiredMargin.toFixed(2));
    }
  };

  // Handle Margin Input changes -> Trade Value = margin * leverage -> Qty = Trade Value / price
  const handleMarginChange = (val: string) => {
    setMarginInput(val);
    const numMargin = parseFloat(val) || 0;
    if (execPrice > 0 && effectiveLeverage > 0) {
      const tradeVal = numMargin * effectiveLeverage;
      const computedLots = tradeVal / execPrice;
      setLotInput(computedLots.toFixed(4));
    }
  };

  // Handle Leverage changes -> Margin on tradevalue = (price * qty purchase) / newLeverage
  const handleLeverageChange = (newLev: number) => {
    const clampedLev = Math.min(newLev, maxLeverage);
    setLeverage(clampedLev);
    if (sizingMode === 'LOT') {
      const numLots = parseFloat(lotInput) || 0;
      if (execPrice > 0 && clampedLev > 0) {
        const tradeVal = numLots * execPrice;
        const requiredMargin = tradeVal / clampedLev;
        setMarginInput(requiredMargin.toFixed(2));
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

  const tradeValue = execPrice * assetUnits;

  const numericMargin = sizingMode === 'MARGIN'
    ? (parseFloat(marginInput) || 0)
    : (effectiveLeverage > 0 ? tradeValue / effectiveLeverage : 0);

  const feeRate = config.enableFees
    ? (orderType === 'MARKET' ? config.takerFeeRate : config.makerFeeRate)
    : 0;
  const estimatedFee = tradeValue * feeRate;

  const liquidationPrice = useMemo(() => {
    if (mode === 'SPOT' || effectiveLeverage <= 1) return 0;
    const mmr = 0.008;
    if (side === 'BUY') {
      return execPrice * (1 - 1 / effectiveLeverage + mmr);
    } else {
      return execPrice * (1 + 1 / effectiveLeverage - mmr);
    }
  }, [mode, effectiveLeverage, side, execPrice]);

  const distanceToLiqPct = useMemo(() => {
    if (liquidationPrice <= 0 || execPrice <= 0) return 0;
    return Math.abs((liquidationPrice - execPrice) / execPrice) * 100;
  }, [liquidationPrice, execPrice]);

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
      setMarginInput(requiredMargin.toFixed(2));
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
    if (numericMargin <= 0) return;

    onPlaceOrder({
      symbol: asset.symbol,
      mode,
      side,
      orderType,
      margin: numericMargin,
      leverage: effectiveLeverage,
      targetPrice: orderType === 'LIMIT' ? parseFloat(targetPriceInput) : undefined,
      takeProfitPrice: enableTP && tpPriceInput ? parseFloat(tpPriceInput) : undefined,
      stopLossPrice: enableSL && slPriceInput ? parseFloat(slPriceInput) : undefined,
      trailingStopPercent: trailingStopInput ? parseFloat(trailingStopInput) : undefined,
    });
  };

  const isGold = asset.category === 'gold';
  const isBtc = asset.symbol === 'BTC';

  return (
    <div
      className="rounded-md p-4 flex flex-col space-y-4 border transition-colors bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
    >
      {/* Shark Exchange Header Badge */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-sm border text-[9px] font-bold bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-secondary)] uppercase tracking-widest"
      >
        <div className="flex items-center gap-2 text-emerald-500">
          <Building2 className="w-3.5 h-3.5" />
          <span>Terminal Engine</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-emerald-500/80">0.016% Maker</span>
          <span className="opacity-10">|</span>
          <span>MAX {maxLeverage}X</span>
        </div>
      </div>

      {/* Terminal View Switcher */}
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

      {/* Render Selected View */}
      {terminalTab === 'AUTOGRID' ? (
        <AutoGridPanel
          asset={asset}
          cashBalance={cashBalance}
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
        <form onSubmit={handleSubmit} className="w-full">
          {/* Responsive 3-Column Terminal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            
            {/* COLUMN 1: Mode, Direction, Order Type & Leverage */}
            <div className="space-y-4">
              <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
                <Sliders className="w-3.5 h-3.5" />
                <span>01. Order Setup</span>
              </div>

              {/* Mode Selector (Spot vs Leveraged) */}
              <div className="flex p-1 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LEVERAGED');
                    if (leverage === 1) setLeverage(isBtc ? 50 : isGold ? 25 : 10);
                  }}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${
                    mode === 'LEVERAGED'
                      ? 'bg-[var(--theme-border)] text-amber-400'
                      : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
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
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${
                    mode === 'SPOT'
                      ? 'bg-[var(--theme-border)] text-emerald-400'
                      : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                  }`}
                >
                  Spot
                </button>
              </div>

              {/* Side Selector (Buy/Long vs Sell/Short) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${
                    side === 'BUY'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border-subtle)] hover:text-[var(--theme-text-secondary)]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {mode === 'SPOT' ? 'Buy' : 'Long'}
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${
                    side === 'SELL'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-[var(--theme-bg-card-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border-subtle)] hover:text-[var(--theme-text-secondary)]'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  {mode === 'SPOT' ? 'Sell' : 'Short'}
                </button>
              </div>

              {/* Order Type (Market vs Limit) */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border-subtle)] text-[9px] uppercase tracking-widest font-bold text-[var(--theme-text-muted)]">
                <span>Execution</span>
                <div className="flex p-0.5 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`px-2.5 py-1 rounded-sm transition-all ${
                      orderType === 'MARKET'
                        ? 'bg-[var(--theme-border)] text-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('LIMIT');
                      if (!targetPriceInput) setTargetPriceInput(currentPrice.toString());
                    }}
                    className={`px-2.5 py-1 rounded-sm transition-all ${
                      orderType === 'LIMIT'
                        ? 'bg-[var(--theme-border)] text-[var(--theme-text-primary)]'
                        : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Limit Target Price Input */}
              {orderType === 'LIMIT' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold">
                    <label className="text-[var(--theme-text-muted)]">Target Price</label>
                    <button
                      type="button"
                      onClick={() => {
                        const target = parseFloat(targetPriceInput) || currentPrice;
                        alertEngine.createAlert(
                          target,
                          target >= currentPrice ? 'ABOVE' : 'BELOW',
                          `Target for Limit ${side} ${asset.symbol}`
                        );
                      }}
                      className="text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                    >
                      <Bell className="w-3 h-3" />
                      Alert
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={targetPriceInput}
                      onChange={(e) => setTargetPriceInput(e.target.value)}
                      placeholder={currentPrice.toString()}
                      className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded-sm px-3 py-2 font-mono text-xs focus:border-[var(--theme-accent)] transition-colors text-[var(--theme-text-primary)]"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-mono text-[var(--theme-text-muted)]">
                      USDT
                    </span>
                  </div>
                </div>
              )}

              {/* Leverage Slider (if leveraged) */}
              {mode === 'LEVERAGED' && (
                <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold mb-3">
                    <span className="text-[var(--theme-text-muted)] flex items-center gap-2">
                      <Sliders className="w-3 h-3" />
                      Multiplier
                    </span>
                    <span className={`font-mono ${leverage >= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {leverage}x
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max={maxLeverage}
                    step="1"
                    value={leverage}
                    onChange={(e) => handleLeverageChange(parseInt(e.target.value))}
                    className="w-full h-1 bg-[var(--theme-border)] rounded-full appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex justify-between text-[8px] font-mono mt-2 text-[var(--theme-text-muted)] uppercase tracking-tighter">
                    <span>1x</span>
                    <span>10x</span>
                    <span>25x</span>
                    {maxLeverage >= 75 && <span>75x</span>}
                    {maxLeverage >= 150 && <span>150x</span>}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Sizing & Risk Orders (TP / SL) */}
            <div className="space-y-4">
              <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
                <Coins className="w-3.5 h-3.5" />
                <span>02. Position Sizing</span>
              </div>

              {/* Sizing Input Toggle: By Lots vs By Margin USDT */}
              <div>
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--theme-text-muted)]">Mode</span>
                    <div className="flex rounded-sm p-0.5 border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)]">
                      <button
                        type="button"
                        onClick={() => setSizingMode('LOT')}
                        className={`px-2 py-0.5 rounded-sm transition-all ${
                          sizingMode === 'LOT'
                            ? 'bg-[var(--theme-border)] text-[var(--theme-text-primary)]'
                            : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                        }`}
                      >
                        Units
                      </button>
                      <button
                        type="button"
                        onClick={() => setSizingMode('MARGIN')}
                        className={`px-2 py-0.5 rounded-sm transition-all ${
                          sizingMode === 'MARGIN'
                            ? 'bg-[var(--theme-border)] text-[var(--theme-text-primary)]'
                            : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                        }`}
                      >
                        Margin
                      </button>
                    </div>
                  </div>

                  <span className="font-mono text-emerald-400">
                    {mode === 'SPOT' && side === 'SELL'
                      ? `${spotBalanceAmount.toFixed(4)} ${asset.symbol}`
                      : `$${cashBalance.toFixed(0)}`}
                  </span>
                </div>

                {sizingMode === 'LOT' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={lotInput}
                        onChange={(e) => handleLotChange(e.target.value)}
                        className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded-sm px-3 py-2 font-mono text-xs focus:border-[var(--theme-accent)] transition-colors text-[var(--theme-text-primary)]"
                        placeholder={defaultSize.toString()}
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-mono font-bold text-[var(--theme-text-muted)] uppercase">
                        {asset.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[var(--theme-text-muted)] uppercase px-1">
                      <span>Val: ${tradeValue.toFixed(0)}</span>
                      <span className="text-amber-500/80">Req: ${numericMargin.toFixed(0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={marginInput}
                        onChange={(e) => handleMarginChange(e.target.value)}
                        className="w-full bg-[var(--theme-bg-card-subtle)] border border-[var(--theme-border-subtle)] rounded-sm px-3 py-2 font-mono text-xs focus:border-[var(--theme-accent)] transition-colors text-[var(--theme-text-primary)]"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-mono text-[var(--theme-text-muted)] uppercase">
                        USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[var(--theme-text-muted)] uppercase px-1">
                      <span>Qty: {assetUnits.toFixed(4)} {asset.symbol}</span>
                      <span className="text-[var(--theme-text-secondary)]">Val: ${tradeValue.toFixed(0)}</span>
                    </div>
                  </div>
                )}

                {/* Quick Shark Exchange Presets */}
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0.002, 0.1, 0.01, 1].map((lots) => (
                      <button
                        key={lots}
                        type="button"
                        onClick={() => applyPresetLot(lots)}
                        className={`py-1 rounded-sm text-[9px] font-mono border transition-all ${
                          parseFloat(lotInput) === lots
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : 'bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]'
                        }`}
                      >
                        {lots}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => handleQuickPercent(pct)}
                        className="py-1 rounded-sm text-[8px] font-bold uppercase tracking-tighter border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)] transition-all"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Take-Profit & Stop-Loss Expandable */}
              {mode === 'LEVERAGED' && (
                <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] space-y-3">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold">
                    <span className="text-[var(--theme-text-muted)] flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      Risk Levels
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyPresetTPSL(4, 2)}
                        className="px-1.5 py-0.5 rounded-sm bg-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors"
                      >
                        2:1
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetTPSL(6, 3)}
                        className="px-1.5 py-0.5 rounded-sm bg-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors"
                      >
                        3:1
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-emerald-500/80 font-bold uppercase tracking-widest">Take Profit</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={tpPriceInput}
                        onChange={(e) => {
                          setTpPriceInput(e.target.value);
                          setEnableTP(true);
                        }}
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] rounded-sm px-2 py-1.5 font-mono text-[10px] focus:border-emerald-500 transition-colors text-[var(--theme-text-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-rose-500/80 font-bold uppercase tracking-widest">Stop Loss</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={slPriceInput}
                        onChange={(e) => {
                          setSlPriceInput(e.target.value);
                          setEnableSL(true);
                        }}
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] rounded-sm px-2 py-1.5 font-mono text-[10px] focus:border-rose-500 transition-colors text-[var(--theme-text-primary)]"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-[var(--theme-border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[8px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Trailing
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="2.0"
                        value={trailingStopInput}
                        onChange={(e) => setTrailingStopInput(e.target.value)}
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] rounded-sm pl-2 pr-6 py-1.5 font-mono text-[10px] focus:border-amber-500 transition-colors text-[var(--theme-text-primary)]"
                      />
                      <span className="absolute right-2 top-2 text-[9px] font-bold text-[var(--theme-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Running Trades Slot Ladder */}
              {mode === 'LEVERAGED' && (
                <TradeSlotLadderWidget
                  positions={positions}
                  asset={asset}
                  side={side}
                  cashBalance={cashBalance}
                  requiredMargin={numericMargin}
                  trend15m={autoGrid.runtime.trend15m}
                  trend1h={autoGrid.runtime.trend1h}
                  takeProfitPrice={enableTP && tpPriceInput ? parseFloat(tpPriceInput) : undefined}
                  stopLossPrice={enableSL && slPriceInput ? parseFloat(slPriceInput) : undefined}
                />
              )}
            </div>

            {/* COLUMN 3: Mini Market Depth, Execution Summary & Submit */}
            <div className="space-y-4">
              <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
                <Building2 className="w-3.5 h-3.5" />
                <span>03. Execution</span>
              </div>

              {/* Mini Market Depth & Bid/Ask Volume Distribution */}
              <MiniMarketDepth
                asset={asset}
                onSelectPrice={(selectedPrice) => {
                  setOrderType('LIMIT');
                  setTargetPriceInput(selectedPrice.toString());
                }}
              />

              {/* Real-World Execution Breakdown */}
              <div className="p-3 rounded-sm border bg-[var(--theme-bg-card-subtle)] border-[var(--theme-border-subtle)] text-[10px] font-mono space-y-2">
                <div className="flex justify-between text-[var(--theme-text-muted)]">
                  <span className="uppercase tracking-tighter">Notional:</span>
                  <span className="text-[var(--theme-text-primary)]">
                    ${tradeValue.toFixed(0)} <span className="opacity-50">({assetUnits.toFixed(4)} {asset.symbol})</span>
                  </span>
                </div>

                <div className="flex justify-between text-[var(--theme-text-muted)]">
                  <span className="uppercase tracking-tighter">Margin ({effectiveLeverage}x):</span>
                  <span className="text-amber-500 font-bold">
                    ${numericMargin.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-[var(--theme-text-muted)]">
                  <span className="uppercase tracking-tighter">Est. Price:</span>
                  <span className="text-[var(--theme-text-primary)]">
                    ${execPrice.toFixed(execPrice < 10 ? 4 : 2)}
                  </span>
                </div>

                <div className="flex justify-between text-[var(--theme-text-muted)]">
                  <span className="uppercase tracking-tighter">Fee ({orderType === 'MARKET' ? 'Taker' : 'Maker'}):</span>
                  <span className="text-amber-500/80">
                    ${estimatedFee.toFixed(3)}
                  </span>
                </div>

                {mode === 'LEVERAGED' && (
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--theme-border-subtle)]">
                    <span className="flex items-center gap-1.5 text-orange-500/80 uppercase tracking-tighter font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      Liq.
                    </span>
                    <span className="text-orange-500 font-bold">
                      ${liquidationPrice.toFixed(2)} <span className="text-[8px] opacity-50">({distanceToLiqPct.toFixed(1)}%)</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
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
                    className={`w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isMaxTrades
                        ? 'bg-[var(--theme-border)] text-[var(--theme-text-muted)]'
                        : side === 'BUY'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20'
                    }`}
                  >
                    {isMaxTrades ? 'Limit Reached' : `Execute ${side} Order`}
                  </button>
                );
              })()}

              {/* Terminal Broker Rules Callout */}
              <div className="p-3 rounded-sm border bg-cyan-500/5 border-cyan-500/10 text-[9px] space-y-1">
                <div className="flex items-center gap-2 font-bold text-cyan-400 uppercase tracking-widest">
                  <Info className="w-3.5 h-3.5" />
                  <span>Terminal Protocol</span>
                </div>
                <p className="text-[var(--theme-text-muted)] leading-relaxed">
                  {isGold ? (
                    <>Gold (PAXG): 75x MAX. 0.016% Maker / 0.064% Taker.</>
                  ) : isBtc ? (
                    <>Bitcoin (BTC): 150x MAX. 0.016% Maker / 0.064% Taker.</>
                  ) : (
                    <>{asset.symbol}: 25x MAX. 0.016% Maker / 0.064% Taker.</>
                  )}
                </p>
              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
};
