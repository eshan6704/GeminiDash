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
  const { isLight } = useTheme();
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

  const currentPrice = asset.price;

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
      className={`rounded-2xl p-4 flex flex-col shadow-lg space-y-3 border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
          : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/40'
      }`}
    >
      {/* Shark Exchange Header Badge */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs ${
          isLight
            ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
            : 'bg-cyan-950/40 border-cyan-500/30 text-neutral-100'
        }`}
      >
        <div className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
          <Building2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Shark Exchange Terminal</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
          <span className="text-amber-600 font-bold" title="Maker: 0.016% | Taker: 0.064% (4x Maker)">
            0.016% Maker / 0.064% Taker
          </span>
          <span className="opacity-30">•</span>
          <span>Max {maxLeverage}x Margin</span>
        </div>
      </div>

      {/* Terminal View Switcher (Trade vs Auto Grid vs Price Alerts) */}
      <div
        className={`flex p-1 rounded-xl border gap-1 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800'
        }`}
      >
        <button
          type="button"
          onClick={() => setTerminalTab('TRADE')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            terminalTab === 'TRADE'
              ? isLight
                ? 'bg-white text-amber-700 shadow-xs'
                : 'bg-neutral-800 text-amber-400 shadow-sm'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Trade</span>
        </button>

        <button
          type="button"
          onClick={() => setTerminalTab('AUTOGRID')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            terminalTab === 'AUTOGRID'
              ? isLight
                ? 'bg-white text-amber-700 shadow-xs'
                : 'bg-neutral-800 text-amber-400 shadow-sm'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Auto Grid</span>
          {autoGrid.gridConfig.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setTerminalTab('ALERTS')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            terminalTab === 'ALERTS'
              ? isLight
                ? 'bg-white text-amber-700 shadow-xs'
                : 'bg-neutral-800 text-amber-400 shadow-sm'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts</span>
          {alertEngine.activeAlertsThisAsset.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
              isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {alertEngine.activeAlertsThisAsset.length}
            </span>
          )}
        </button>
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
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
                <Sliders className="w-3.5 h-3.5" />
                <span>1. Order Setup & Mode</span>
              </div>

              {/* Mode Selector (Spot vs Leveraged) */}
              <div
                className={`flex p-1 rounded-xl border ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('LEVERAGED');
                    if (leverage === 1) setLeverage(isBtc ? 50 : isGold ? 25 : 10);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'LEVERAGED'
                      ? isLight
                        ? 'bg-white text-amber-700 font-bold shadow-xs'
                        : 'bg-neutral-800 text-amber-400 shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Futures ({maxLeverage}x)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('SPOT');
                    setLeverage(1);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'SPOT'
                      ? isLight
                        ? 'bg-white text-emerald-700 font-bold shadow-xs'
                        : 'bg-neutral-800 text-emerald-400 shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Spot (1:1)
                </button>
              </div>

              {/* Side Selector (Buy/Long vs Sell/Short) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {mode === 'SPOT' ? 'BUY (Spot)' : 'LONG / BUY'}
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    side === 'SELL'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  {mode === 'SPOT' ? 'SELL (Spot)' : 'SHORT / SELL'}
                </button>
              </div>

              {/* Order Type (Market vs Limit) */}
              <div className={`flex items-center justify-between pb-2 border-b text-xs ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
                <span className={isLight ? 'text-slate-600 font-medium' : 'text-neutral-400 font-medium'}>Order Execution</span>
                <div className={`flex p-0.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800'}`}>
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                      orderType === 'MARKET'
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-xs'
                          : 'bg-neutral-800 text-white'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-neutral-500 hover:text-neutral-300'
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
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                      orderType === 'LIMIT'
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-xs'
                          : 'bg-neutral-800 text-white'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Limit Target Price Input */}
              {orderType === 'LIMIT' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className={`font-medium ${isLight ? 'text-slate-700' : 'text-neutral-400'}`}>
                      Target Limit Price (USDT)
                    </label>
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
                      className="text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-1 font-mono transition-colors font-medium"
                      title="Create browser price alert for this target limit price"
                    >
                      <Bell className="w-3 h-3" />
                      Alert @ Target
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={targetPriceInput}
                      onChange={(e) => setTargetPriceInput(e.target.value)}
                      placeholder={currentPrice.toString()}
                      className={`w-full border rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-500 ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                      }`}
                      required
                    />
                    <span className={`absolute right-3 top-2.5 text-xs font-mono ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      USDT
                    </span>
                  </div>
                </div>
              )}

              {/* Leverage Slider (if leveraged) */}
              {mode === 'LEVERAGED' && (
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-neutral-400'}`}>
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      Shark Margin Multiplier
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        leverage >= 50
                          ? isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400'
                          : leverage >= 20
                          ? isLight ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-400'
                          : isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {leverage}x / max {maxLeverage}x
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max={maxLeverage}
                    step="1"
                    value={leverage}
                    onChange={(e) => handleLeverageChange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className={`flex justify-between text-[10px] font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                    <span>1x</span>
                    <span>10x</span>
                    <span>25x {isGold || isBtc ? '' : '(Max)'}</span>
                    {maxLeverage >= 75 && <span className="text-amber-600 font-bold">75x</span>}
                    {maxLeverage >= 150 && <span className="text-rose-600 font-bold">150x</span>}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Sizing & Risk Orders (TP / SL) */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
                <Coins className="w-3.5 h-3.5" />
                <span>2. Position Sizing & Risk</span>
              </div>

              {/* Sizing Input Toggle: By Lots vs By Margin USDT */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-neutral-400'}`}>Order Sizing:</span>
                    <div className={`flex rounded-lg p-0.5 border text-[10px] ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800'}`}>
                      <button
                        type="button"
                        onClick={() => setSizingMode('LOT')}
                        className={`px-2 py-0.5 rounded font-medium transition-all ${
                          sizingMode === 'LOT'
                            ? isLight ? 'bg-white text-amber-800 font-bold shadow-xs' : 'bg-neutral-800 text-amber-300'
                            : isLight ? 'text-slate-600' : 'text-neutral-500'
                        }`}
                      >
                        Lot / Units
                      </button>
                      <button
                        type="button"
                        onClick={() => setSizingMode('MARGIN')}
                        className={`px-2 py-0.5 rounded font-medium transition-all ${
                          sizingMode === 'MARGIN'
                            ? isLight ? 'bg-white text-amber-800 font-bold shadow-xs' : 'bg-neutral-800 text-amber-300'
                            : isLight ? 'text-slate-600' : 'text-neutral-500'
                        }`}
                      >
                        Margin ($)
                      </button>
                    </div>
                  </div>

                  <span className={`font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                    Avail:{' '}
                    <strong className={isLight ? 'text-slate-900' : 'text-neutral-200'}>
                      {mode === 'SPOT' && side === 'SELL'
                        ? `${spotBalanceAmount.toFixed(4)} ${asset.symbol}`
                        : `$${cashBalance.toFixed(2)} USDT`}
                    </strong>
                  </span>
                </div>

                {sizingMode === 'LOT' ? (
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={lotInput}
                        onChange={(e) => handleLotChange(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-500 ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                        }`}
                        placeholder={defaultSize.toString()}
                        required
                      />
                      <span className={`absolute right-3 top-2.5 text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        {asset.symbol} ({isGold ? 'oz fine gold' : 'lots'})
                      </span>
                    </div>
                    <div className={`flex justify-between text-[10px] font-mono mt-1 px-1 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                      <span>Trade Value: ~${tradeValue.toFixed(2)}</span>
                      <span className="text-amber-600 font-semibold">Margin ({effectiveLeverage}x): ~${numericMargin.toFixed(2)} USDT</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={marginInput}
                        onChange={(e) => handleMarginChange(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:border-amber-500 ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                        }`}
                        required
                      />
                      <span className={`absolute right-3 top-2.5 text-xs font-mono ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                        USDT
                      </span>
                    </div>
                    <div className={`flex justify-between text-[10px] font-mono mt-1 px-1 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                      <span>Purchase Qty: ~{assetUnits.toFixed(4)} {asset.symbol}</span>
                      <span className={isLight ? 'text-slate-800 font-semibold' : 'text-neutral-300'}>Trade Value: ~${tradeValue.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Quick Shark Exchange Presets */}
                <div className="mt-2 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetLot(0.002)}
                      className={`py-1 rounded text-[10px] font-mono border transition-colors ${
                        lotInput === '0.002'
                          ? 'border-amber-500 text-amber-800 font-bold bg-amber-100'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      0.002 Lot
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetLot(0.1)}
                      className={`py-1 rounded text-[10px] font-mono border transition-colors ${
                        lotInput === '0.1'
                          ? 'border-amber-500 text-amber-800 font-bold bg-amber-100'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      0.1 Size
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetLot(0.01)}
                      className={`py-1 rounded text-[10px] font-mono border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      0.01 Lot
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetLot(1)}
                      className={`py-1 rounded text-[10px] font-mono border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      1.0 Lot
                    </button>
                  </div>

                  {/* Quick % buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => handleQuickPercent(pct)}
                        className={`py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {pct}% Cash
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Take-Profit & Stop-Loss Expandable */}
              {mode === 'LEVERAGED' && (
                <div
                  className={`p-2.5 rounded-xl border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-neutral-400'}`}>
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      TP / SL Orders
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyPresetTPSL(4, 2)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                        }`}
                      >
                        2:1 Ratio
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetTPSL(6, 3)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                        }`}
                      >
                        3:1 Ratio
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-emerald-600 font-semibold block mb-0.5">Take Profit</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={
                          side === 'BUY'
                            ? (execPrice * 1.05).toFixed(2)
                            : (execPrice * 0.95).toFixed(2)
                        }
                        value={tpPriceInput}
                        onChange={(e) => {
                          setTpPriceInput(e.target.value);
                          setEnableTP(true);
                        }}
                        className={`w-full border rounded-lg px-2 py-1 font-mono text-xs focus:outline-none focus:border-emerald-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-rose-600 font-semibold block mb-0.5">Stop Loss</label>
                      <input
                        type="number"
                        step="any"
                        placeholder={
                          side === 'BUY'
                            ? (execPrice * 0.97).toFixed(2)
                            : (execPrice * 1.03).toFixed(2)
                        }
                        value={slPriceInput}
                        onChange={(e) => {
                          setSlPriceInput(e.target.value);
                          setEnableSL(true);
                        }}
                        className={`w-full border rounded-lg px-2 py-1 font-mono text-xs focus:outline-none focus:border-rose-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-neutral-800/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Smart Trailing SL
                      </label>
                      <span className="text-[9px] text-neutral-500 font-medium">Automatic Adjustment</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="2.0"
                        value={trailingStopInput}
                        onChange={(e) => setTrailingStopInput(e.target.value)}
                        className={`w-full border rounded-lg pl-2 pr-6 py-1 font-mono text-xs focus:outline-none focus:border-amber-500 ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                        }`}
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] font-bold text-neutral-500">%</span>
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
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
                <Building2 className="w-3.5 h-3.5" />
                <span>3. Execution & Depth</span>
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
              <div
                className={`p-3 rounded-xl border text-[11px] font-mono space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-neutral-950 border-neutral-800/80'
                }`}
              >
                <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  <span>Trade Value:</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                    ${tradeValue.toFixed(2)}{' '}
                    <span className={`text-[10px] font-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      ({assetUnits.toFixed(4)} {asset.symbol})
                    </span>
                  </span>
                </div>

                <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  <span>Margin Required ({effectiveLeverage}x):</span>
                  <span className="text-amber-600 font-bold">
                    ${numericMargin.toFixed(2)} USDT
                  </span>
                </div>

                <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  <span>Est. Price:</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                    ${execPrice.toFixed(execPrice < 10 ? 4 : 2)}
                  </span>
                </div>

                <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  <span>Brokerage Fee ({orderType === 'MARKET' ? '0.064%' : '0.016%'}):</span>
                  <span className="text-amber-600 font-semibold">
                    ${estimatedFee.toFixed(3)}
                  </span>
                </div>

                {mode === 'LEVERAGED' && (
                  <div className={`flex justify-between items-center pt-1 border-t ${isLight ? 'border-slate-200 text-slate-600' : 'border-neutral-800 text-neutral-400'}`}>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      Liquidation:
                    </span>
                    <span className="text-orange-600 font-bold">
                      ${liquidationPrice.toFixed(2)} ({distanceToLiqPct.toFixed(1)}%)
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
                    className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isMaxTrades
                        ? isLight ? 'bg-slate-200 text-slate-500 border border-slate-300' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        : side === 'BUY'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/20'
                    }`}
                  >
                    {isMaxTrades
                      ? `Max Live Trades Reached (${positions.length}/10)`
                      : `Execute ${side === 'BUY' ? 'Buy / Long' : 'Sell / Short'} ${assetUnits.toFixed(4)} ${asset.symbol}`}
                  </button>
                );
              })()}

              {/* Shark Exchange Broker Rules Callout */}
              <div
                className={`p-2.5 rounded-xl border text-[11px] ${
                  isLight ? 'bg-cyan-50/70 border-cyan-200 text-cyan-950' : 'bg-cyan-950/20 border-cyan-500/20 text-neutral-300'
                }`}
              >
                <div className={`flex items-center gap-1.5 font-semibold mb-0.5 ${isLight ? 'text-cyan-900' : 'text-cyan-400'}`}>
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Shark Exchange Rules:</span>
                </div>
                <p className={`leading-relaxed text-[10px] ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  {isGold ? (
                    <>
                      <strong className="text-amber-500">Gold (PAXG):</strong> Up to 75x leverage. Brokerage: 0.016% Maker / 0.064% Taker.
                    </>
                  ) : isBtc ? (
                    <>
                      <strong className="text-orange-500">Bitcoin (BTC):</strong> Up to 150x leverage. Brokerage: 0.016% Maker / 0.064% Taker.
                    </>
                  ) : (
                    <>
                      <strong className="text-blue-500">{asset.symbol}:</strong> Up to 25x leverage. Brokerage: 0.016% Maker / 0.064% Taker.
                    </>
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
