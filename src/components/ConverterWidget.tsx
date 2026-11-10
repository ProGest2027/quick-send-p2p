/**
 * Quick Send — Terminal Bancário de Câmbio de Moedas (EUR € / AOA Kz)
 * Design com identidade visual bancária, cotações oficiais e símbolos explícitos.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Clock,
  ShieldCheck,
  Info,
  TrendingUp,
  Landmark,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Currency } from '../types';
import { db } from '../services/database';
import { CURRENCY_CONFIG, CurrencyBadge, CurrencyIcon, formatMoney } from '../utils/currencyFormat';

interface ConverterWidgetProps {
  onGoToMarketplace?: () => void;
  compact?: boolean;
}

export const ConverterWidget: React.FC<ConverterWidgetProps> = ({ onGoToMarketplace, compact = false }) => {
  const [fromCurrency, setFromCurrency] = useState<Currency>('EUR');
  const [toCurrency, setToCurrency] = useState<Currency>('AOA');
  const [amount, setAmount] = useState<string>('100');

  const rates = db.getRates();

  // Find rate in database for this pair
  const currentPair = `${fromCurrency}/${toCurrency}`;
  const rateObj = useMemo(() => {
    // Direct pair check
    const direct = rates.find((r) => r.pair === currentPair);
    if (direct) {
      return {
        rate: direct.referenceRate,
        buy: direct.buyRate,
        sell: direct.sellRate,
        lastUpdated: direct.lastUpdated,
      };
    }

    // Reverse check
    const reversePair = `${toCurrency}/${fromCurrency}`;
    const reverse = rates.find((r) => r.pair === reversePair);
    if (reverse && reverse.referenceRate > 0) {
      return {
        rate: Number((1 / reverse.referenceRate).toFixed(6)),
        buy: Number((1 / reverse.sellRate).toFixed(6)),
        sell: Number((1 / reverse.buyRate).toFixed(6)),
        lastUpdated: reverse.lastUpdated,
      };
    }

    // Default fallback
    return { rate: 989.5, buy: 978.0, sell: 1001.0, lastUpdated: new Date().toISOString() };
  }, [rates, currentPair, fromCurrency, toCurrency]);

  const numAmount = parseFloat(amount) || 0;
  const rawResult = numAmount * rateObj.rate;
  const formattedResult = rawResult.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: toCurrency === 'AOA' ? 2 : 4,
  });

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleFromChange = (newFrom: Currency) => {
    if (newFrom === toCurrency) {
      setToCurrency(fromCurrency);
    }
    setFromCurrency(newFrom);
  };

  const handleToChange = (newTo: Currency) => {
    if (newTo === fromCurrency) {
      setFromCurrency(toCurrency);
    }
    setToCurrency(newTo);
  };

  const fromCfg = CURRENCY_CONFIG[fromCurrency];
  const toCfg = CURRENCY_CONFIG[toCurrency];

  const presets = fromCurrency === 'EUR' ? ['50', '100', '250', '500', '1000'] : ['50000', '100000', '250000', '500000', '1000000'];

  const formattedDate = new Date(rateObj.lastUpdated).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#0c162c] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl transition-all ${
        compact ? 'p-4' : 'p-6 sm:p-7'
      }`}
    >
      {/* Institutional Top Accents */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Terminal de Câmbio Interbancário</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Oficial
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Taxa de referência EUR (€) / AOA (Kz) em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-800/60 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Main Converter Grid */}
      <div className="space-y-3">
        {/* Box 1: You Send */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider text-[11px]">Você Envia</span>
            <span className="text-[11px] font-normal text-slate-400">Moeda de origem</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-400 select-none">
                {fromCfg.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white focus:outline-none tabular-nums tracking-tight"
                placeholder="0.00"
              />
            </div>

            {/* Currency Selector Pill */}
            <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer">
              <CurrencyIcon currency={fromCurrency} className="w-5 h-5 shadow-xs" />
              <select
                value={fromCurrency}
                onChange={(e) => handleFromChange(e.target.value as Currency)}
                className="bg-transparent font-black text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer tracking-wide"
              >
                <option value="EUR">EUR (€)</option>
                <option value="AOA">AOA (Kz)</option>
              </select>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Rápido:</span>
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all ${
                  amount === p
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                {parseInt(p) >= 1000 ? `${(parseInt(p) / 1000).toLocaleString('pt-PT')}k` : p} {fromCfg.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Central Swap Divider */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
          </div>
          <button
            type="button"
            onClick={handleSwap}
            title="Inverter Moedas (EUR ⇄ AOA)"
            aria-label="Inverter moedas"
            className="relative z-10 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 duration-200"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Box 2: You Receive */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 dark:from-blue-950/30 dark:to-slate-900/60 shadow-inner-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider text-[11px] text-blue-600 dark:text-blue-400 font-bold">
              Você Recebe (Estimado)
            </span>
            <span className="text-[11px] font-normal text-slate-400">Câmbio líquido</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 select-none">
                {toCfg.symbol}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
                {formattedResult}
              </div>
            </div>

            {/* Target Currency Selector Pill */}
            <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer">
              <CurrencyIcon currency={toCurrency} className="w-5 h-5 shadow-xs" />
              <select
                value={toCurrency}
                onChange={(e) => handleToChange(e.target.value as Currency)}
                className="bg-transparent font-black text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer tracking-wide"
              >
                <option value="AOA">AOA (Kz)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-blue-200/40 dark:border-slate-800">
            <span>Cotação base:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              1 {fromCfg.symbol} = {rateObj.rate.toLocaleString('pt-PT', { maximumFractionDigits: 4 })} {toCfg.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Banking Trust Strip */}
      <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Spread garantido · <strong className="text-slate-800 dark:text-slate-200">0% comissões ocultas</strong>
          </span>
        </div>

        {onGoToMarketplace && (
          <button
            onClick={onGoToMarketplace}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Ver Ofertas com esta Moeda</span>
            <span className="font-mono font-bold">({toCfg.symbol})</span>
          </button>
        )}
      </div>

      {/* Disclaimers */}
      <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          Valores baseados nas cotações de referência interbancárias. As operações no mercado P2P são liquidadas diretamente entre as partes via MB WAY e Multicaixa Express.
        </span>
      </div>
    </div>
  );
};
