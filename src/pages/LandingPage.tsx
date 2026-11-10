/**
 * Quick Send — Landing Page (Identidade Bancária Oficial)
 * Portal institucional multimoeda (EUR € / AOA Kz) com terminal de câmbio interbancário,
 * garantias de segurança, conformidade KYC bancária e assinatura Premium (20,00 € MB WAY: 936924849).
 */

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  CreditCard,
  Lock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Crown,
  Landmark,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ConverterWidget } from '../components/ConverterWidget';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { db } from '../services/database';
import { CURRENCY_CONFIG, CurrencyBadge, CurrencyIcon, FlagEUR, FlagAOA, formatMoney } from '../utils/currencyFormat';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const rates = db.getRates();

  const faqs = [
    {
      q: 'O que é a plataforma bancária P2P QUICK SEND?',
      a: 'A QUICK SEND é uma infraestrutura fintech de intermediação financeira peer-to-peer (P2P) desenhada especificamente para negociação direta de câmbio entre Euro (€) e Kwanza Angolano (Kz), oferecendo transparência total de taxas interbancárias e protocolo de conformidade.',
    },
    {
      q: 'Como funciona a liquidação e a dupla confirmação?',
      a: 'Quando uma negociação é iniciada, o comprador e o vendedor acordam o montante em € e Kz. Os pagamentos são executados pelos canais autorizados (MB WAY em Portugal ou Multicaixa Express em Angola). A operação apenas é liberada após o receptor confirmar formalmente a receção dos fundos.',
    },
    {
      q: 'Quanto custa a assinatura Premium e como se liquida?',
      a: 'A assinatura Premium custa exatamente 20,00 € por mês. O pagamento é realizado por transferência instantânea MB WAY para o número 936924849. Após a operação, o utilizador carrega o comprovativo para homologação imediata pelo Super Admin.',
    },
    {
      q: 'Os utilizadores gratuitos podem transacionar na plataforma?',
      a: 'Sim. Utilizadores com conta base podem consultar as cotações interbancárias em tempo real, utilizar o terminal de câmbio oficial, consultar as ofertas públicas e submeter solicitações de compra e venda.',
    },
    {
      q: 'Por que motivo a validação KYC (Know Your Customer) é exigida?',
      a: 'A verificação de identidade bancária garante a idoneidade de todos os operadores, prevenindo fraudes e perfis anónimos, em cumprimento rigoroso das melhores práticas de segurança financeira e conformidade AML.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* 1. Hero Section com Visual Bancário */}
      <section className="relative overflow-hidden pt-6 sm:pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Coluna Esquerda: Proposta de Valor Bancária */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge de Segurança */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-tight shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Protocolo de Câmbio P2P Seguro · EUR (€) ⇄ AOA (Kz)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                O seu portal bancário de câmbio multimoeda P2P.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Transacione Euro (<strong className="font-extrabold text-blue-600 dark:text-blue-400">€</strong>) e Kwanza (<strong className="font-extrabold text-red-600 dark:text-red-400">Kz</strong>) diretamente com outros operadores com taxas interbancárias transparentes e liquidação por MB WAY e Multicaixa Express.
              </p>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
                >
                  <Landmark className="w-4 h-4" />
                  <span>Aceder ao Mercado P2P</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('premium')}
                  className="px-5 py-3.5 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-xs"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Plano Premium (20,00 €)</span>
                </button>

                <PWAInstallButton />
              </div>

              {/* Selos de Conformidade e Moedas */}
              <div className="pt-5 grid grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800/80 max-w-lg text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white text-sm">
                    <FlagEUR className="w-4 h-4 shadow-xs" />
                    <span>EUR (€)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Zona Euro &amp; Portugal</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white text-sm">
                    <FlagAOA className="w-4 h-4 shadow-xs" />
                    <span>AOA (Kz)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">República de Angola</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>KYC Ativo</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Identidade Auditada</div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Terminal Bancário de Câmbio */}
            <div className="lg:col-span-5">
              <ConverterWidget onGoToMarketplace={() => onNavigate('marketplace')} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Painel Interbancário de Cotações Oficiais */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0c162c] to-[#091124] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                  Quadro Oficial de Câmbio Interbancário
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Taxas de referência institucionais fixadas pela tesouraria da plataforma QUICK SEND.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cotações Atualizadas em Tempo Real</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            {rates.map((r) => {
              const isEurAoa = r.pair === 'EUR/AOA';
              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col justify-between hover:border-blue-500/60 transition-all shadow-md group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {isEurAoa ? <FlagEUR className="w-6 h-6 shadow-xs" /> : <FlagAOA className="w-6 h-6 shadow-xs" />}
                      <span className="text-xl font-black text-white font-mono tracking-tight">
                        {r.pair}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
                        {isEurAoa ? 'EUR (€) → AOA (Kz)' : 'AOA (Kz) → EUR (€)'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Referência</span>
                      <span className="text-lg font-black font-mono text-emerald-400 tabular-nums">
                        {r.referenceRate.toLocaleString('pt-PT', { maximumFractionDigits: 4 })}{' '}
                        {isEurAoa ? 'Kz' : '€'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block font-semibold">COMPRA (BID)</span>
                      <span className="font-extrabold text-white text-sm tabular-nums">
                        {r.buyRate.toLocaleString('pt-PT', { maximumFractionDigits: 4 })}{' '}
                        {isEurAoa ? 'Kz' : '€'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block font-semibold">VENDA (ASK)</span>
                      <span className="font-extrabold text-blue-300 text-sm tabular-nums">
                        {r.sellRate.toLocaleString('pt-PT', { maximumFractionDigits: 4 })}{' '}
                        {isEurAoa ? 'Kz' : '€'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block font-semibold">SPREAD</span>
                      <span className="font-extrabold text-amber-400 text-sm tabular-nums">
                        {Math.abs(r.sellRate - r.buyRate).toFixed(2)} {isEurAoa ? 'Kz' : '€'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Pilares do Sistema Bancário P2P */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
            <span>Infraestrutura Institucional</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Como Funciona o Mercado Bancário P2P
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Três etapas invioláveis para troca de moeda com garantia de dupla confirmação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0c162c] border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center font-black text-lg">
              01
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
              Oferta com Símbolo Oficial
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Consulte ofertas ativas em <strong>Euro (€)</strong> ou <strong>Kwanza (Kz)</strong>. Os membros autorizados publicam montantes mínimos e máximos com taxa de câmbio expressa e sem surpresas.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0c162c] border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-500 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center font-black text-lg">
              02
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
              Liquidação via MB WAY ou Express
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              A liquidação decorre diretamente entre as contas dos intervenientes. O comprador transfere para o IBAN ou telefone acordado e o vendedor confirma no botão formal <strong>"Confirmar que recebi"</strong>.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0c162c] border border-slate-200/90 dark:border-slate-800 shadow-md space-y-4 hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center font-black text-lg">
              03
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
              Auditoria do Super Admin
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O sistema emite um alarme sonoro contínuo ao Super Admin a cada transição crítica, mantendo registo em base de dados (Supabase PostgreSQL) para máxima integridade e auditoria.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Destaque de Assinatura Premium com Cartão Institucional */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#0c162c] via-[#101e3d] to-[#070e1c] border-2 border-slate-700 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>Conta de Operador Premium</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Assinatura Premium QUICK SEND
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Habilite a sua conta para publicar ofertas no mercado de câmbio, negociar montantes ilimitados em Euro (€) e Kwanza (Kz) e usufruir de atendimento prioritário.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Publicação de anúncios de compra e venda</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Chat criptografado direto com operadores</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prioridade máxima de alarme ao Super Admin</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Selo de Operador Verificado</span>
                </div>
              </div>
            </div>

            {/* Caixa de Preço e MB WAY com Estilo Bancário */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-md space-y-5 text-center shadow-2xl">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-extrabold">
                Taxa de Adesão Mensal
              </div>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-5xl font-black text-white font-mono tracking-tight">20,00</span>
                <span className="text-2xl font-black text-blue-400 font-mono">€</span>
                <span className="text-xs text-slate-400 font-medium">/ mês</span>
              </div>

              {/* MB WAY Card */}
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700/80 text-xs text-left space-y-1.5 font-mono shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-sans font-semibold">Pagamento Instantâneo:</span>
                  <span className="text-[10px] font-bold text-rose-400 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800">
                    MB WAY
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-400 tracking-wider">
                  936 924 849
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Validação direta pelo Super Admin após envio de comprovativo.
                </div>
              </div>

              <button
                onClick={() => onNavigate('premium')}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Ativar Plano Premium (20,00 €)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Seção de Dúvidas Frequentes (FAQ) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Transparência Bancária</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Respostas claras sobre taxas, segurança de fundos e métodos autorizados.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c162c] overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    openFaqIndex === idx ? 'rotate-180 text-blue-600' : 'text-slate-400'
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
