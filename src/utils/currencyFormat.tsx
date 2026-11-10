import React from 'react';
import { Currency } from '../types';

/**
 * Bandeira SVG oficial da União Europeia (EUR)
 * Evita que o Windows substitua o emoji de bandeira pelas letras "EU".
 */
export const FlagEUR: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 640 480" className={`rounded-full shrink-0 shadow-xs inline-block ${className}`}>
    <rect width="640" height="480" fill="#003399" />
    <g fill="#FFCC00" transform="translate(320,240) scale(36)">
      <circle cx="0" cy="-4" r="0.65" />
      <circle cx="2" cy="-3.46" r="0.65" />
      <circle cx="3.46" cy="-2" r="0.65" />
      <circle cx="4" cy="0" r="0.65" />
      <circle cx="3.46" cy="2" r="0.65" />
      <circle cx="2" cy="3.46" r="0.65" />
      <circle cx="0" cy="4" r="0.65" />
      <circle cx="-2" cy="3.46" r="0.65" />
      <circle cx="-3.46" cy="2" r="0.65" />
      <circle cx="-4" cy="0" r="0.65" />
      <circle cx="-3.46" cy="-2" r="0.65" />
      <circle cx="-2" cy="-3.46" r="0.65" />
    </g>
  </svg>
);

/**
 * Bandeira SVG oficial de Angola (AOA)
 * Evita que o Windows substitua o emoji de bandeira pelas letras "AO".
 */
export const FlagAOA: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 640 480" className={`rounded-full shrink-0 shadow-xs inline-block ${className}`}>
    <rect width="640" height="240" fill="#CC092F" />
    <rect y="240" width="640" height="240" fill="#000000" />
    <g fill="#FFD100" transform="translate(320,240)">
      {/* Engrenagem / Machete / Estrela angolana estilizada */}
      <circle cx="0" cy="0" r="38" fill="none" stroke="#FFD100" strokeWidth="10" strokeDasharray="22 8" />
      <polygon points="0,-18 5,-5 19,-5 8,4 12,18 0,9 -12,18 -8,4 -19,-5 -5,-5" />
      <line x1="-30" y1="22" x2="30" y2="-16" stroke="#FFD100" strokeWidth="6" strokeLinecap="round" />
    </g>
  </svg>
);

export interface CurrencyMetadata {
  code: Currency;
  name: string;
  symbol: string;
  country: string;
  accentColor: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textColor: string;
}

export const CURRENCY_CONFIG: Record<Currency, CurrencyMetadata> = {
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    country: 'União Europeia / Portugal',
    accentColor: '#1A56DB',
    bgLight: 'bg-blue-50/90',
    bgDark: 'dark:bg-blue-950/50',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800/80',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  AOA: {
    code: 'AOA',
    name: 'Kwanza Angolano',
    symbol: 'Kz',
    country: 'República de Angola',
    accentColor: '#DC2626',
    bgLight: 'bg-rose-50/90',
    bgDark: 'dark:bg-rose-950/50',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800/80',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
};

/**
 * Renderiza o ícone SVG visual da bandeira correspondente
 */
export const CurrencyIcon: React.FC<{ currency: Currency; className?: string }> = ({
  currency,
  className = 'w-5 h-5',
}) => {
  if (currency === 'EUR') return <FlagEUR className={className} />;
  if (currency === 'AOA') return <FlagAOA className={className} />;
  return null;
};

/**
 * Formata um valor numérico com o símbolo oficial da moeda (€ ou Kz)
 * Ex: 1000 EUR -> "1.000,00 €"
 * Ex: 500000 AOA -> "500.000,00 Kz"
 */
export function formatMoney(
  amount: number | string | undefined | null,
  currency: Currency,
  options?: {
    showSymbol?: boolean;
    symbolPosition?: 'prefix' | 'suffix';
    decimals?: number;
  }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  const config = CURRENCY_CONFIG[currency] || { symbol: currency, code: currency };
  const showSymbol = options?.showSymbol !== false;
  const symbolPosition = options?.symbolPosition || 'suffix';
  const decimals = options?.decimals !== undefined ? options.decimals : 2;

  const formattedNum = num.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (!showSymbol) return formattedNum;

  if (symbolPosition === 'prefix') {
    return `${config.symbol} ${formattedNum}`;
  }
  return `${formattedNum} ${config.symbol}`;
}

/**
 * Formata taxa de conversão entre pares com símbolos
 * Ex: EUR/AOA -> "1 € = 989,50 Kz"
 */
export function formatExchangeRate(rate: number, from: Currency, to: Currency): string {
  const fromCfg = CURRENCY_CONFIG[from];
  const toCfg = CURRENCY_CONFIG[to];
  const rateFormatted = rate.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return `1 ${fromCfg.symbol} = ${rateFormatted} ${toCfg.symbol}`;
}

/**
 * Componente de Badge Bancário de Moeda com Bandeira SVG real e Símbolo
 */
export const CurrencyBadge: React.FC<{
  currency: Currency;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}> = ({ currency, size = 'md', showName = false, className = '' }) => {
  const cfg = CURRENCY_CONFIG[currency];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border shadow-xs tracking-tight ${cfg.bgLight} ${cfg.bgDark} ${cfg.borderLight} ${cfg.borderDark} ${cfg.textColor} ${sizeClasses} ${className}`}
    >
      <CurrencyIcon currency={currency} className={iconSizes} />
      <span className="font-extrabold font-mono">{cfg.symbol}</span>
      <span className="text-[10px] uppercase font-semibold opacity-80">{cfg.code}</span>
      {showName && <span className="font-medium opacity-90 hidden sm:inline">· {cfg.name}</span>}
    </span>
  );
};
