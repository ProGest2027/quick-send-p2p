/**
 * Quick Send — 6-Way Currency Converter Widget
 * Accurately converts between EUR and AOA using official admin rates,
 * displaying real spreads, last updated timestamps, and clean swap toggles.
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Clock, ShieldCheck, Info } from 'lucide-react';
import { Currency } from '../types';
import { db } from '../services/database';

interface ConverterWidgetProps {
  onGoToMarketplace?: () => void;
  compact?: boolean;
}

const CURRENCY_METADATA: Record<Currency, { name: string; symbol: string; flag: string }> = {
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  AOA: { name: 'Kwanza Angolano', symbol: 'Kz', flag: '🇦🇴' },
};

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
    if (direct) return { rate: direct.referenceRate, buy: direct.buyRate, sell: direct.sellRate, lastUpdated: direct.lastUpdated };

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

    // Default fallback if pair not found
    return { rate: 1, buy: 1, sell: 1, lastUpdated: new Date().toISOString() };
  }, [rates, currentPair, fromCurrency, toCurrency]);

  const numAmount = parseFloat(amount) || 0;
  const result = (numAmount * rateObj.rate).toLocaleString('pt-PT', {
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

  const formattedDate = new Date(rateObj.lastUpdated).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Conversor Oficial de Câmbio</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Taxas de referência institucionais aplicadas em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
        {/* Source Currency */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Montante a Converter
          </label>
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 p-2.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-[#246BFD] focus-within:border-transparent transition-all">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-xl font-bold font-mono text-slate-900 dark:text-white focus:outline-none tabular-nums"
              placeholder="0.00"
            />
            <div className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-xs">
              <span className="text-lg">{CURRENCY_METADATA[fromCurrency].flag}</span>
              <select
                value={fromCurrency}
                onChange={(e) => handleFromChange(e.target.value as Currency)}
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="EUR">EUR</option>
                <option value="AOA">AOA</option>
              </select>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 px-1 truncate">
            {CURRENCY_METADATA[fromCurrency].name}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 md:my-0">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Inverter moedas"
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#246BFD] shadow-sm flex items-center justify-center transition-transform hover:rotate-180 duration-300"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Target Currency */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Valor Estimado a Receber
          </label>
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 p-2.5 flex items-center gap-3">
            <div className="w-full bg-transparent text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums overflow-x-auto whitespace-nowrap">
              {result}
            </div>
            <div className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-xs">
              <span className="text-lg">{CURRENCY_METADATA[toCurrency].flag}</span>
              <select
                value={toCurrency}
                onChange={(e) => handleToChange(e.target.value as Currency)}
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="AOA">AOA</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 px-1 truncate">
            {CURRENCY_METADATA[toCurrency].name}
          </div>
        </div>
      </div>

      {/* Rate Details Strip */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Taxa de Referência:</span>
          <span className="font-mono tabular-nums font-bold text-[#246BFD]">
            1 {fromCurrency} = {rateObj.rate.toLocaleString('pt-PT', { maximumFractionDigits: 6 })} {toCurrency}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-500">
            Compra: {rateObj.buy.toLocaleString('pt-PT', { maximumFractionDigits: 4 })} / Venda: {rateObj.sell.toLocaleString('pt-PT', { maximumFractionDigits: 4 })}
          </span>
        </div>

        {onGoToMarketplace && (
          <button
            onClick={onGoToMarketplace}
            className="px-4 py-2 bg-[#246BFD] hover:bg-blue-600 text-white font-medium rounded-xl text-xs transition-colors shadow-xs shrink-0"
          >
            Ver Ofertas no Mercado P2P
          </button>
        )}
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          As taxas do conversor são informativas. As negociações no marketplace P2P obedecem aos valores propostos diretamente pelos anunciantes.
        </span>
      </div>
    </div>
  );
};
