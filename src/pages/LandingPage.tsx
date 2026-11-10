/**
 * Quick Send — Landing Page
 * Official presentation of the P2P exchange marketplace, live rates, 6-way converter,
 * Premium plan presentation (20€ MB WAY: 936924849), how it works, and FAQ.
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
} from 'lucide-react';
import { ConverterWidget } from '../components/ConverterWidget';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { db } from '../services/database';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const rates = db.getRates();

  const faqs = [
    {
      q: 'O que é a plataforma QUICK SEND?',
      a: 'A QUICK SEND é uma plataforma fintech de marketplace de câmbio peer-to-peer (P2P) que liga utilizadores que pretendem comprar e vender moedas entre si (EUR e AOA) com transparência de taxas e segurança de conformidade.',
    },
    {
      q: 'Como funciona o sistema de mediação e confirmação de receção?',
      a: 'Quando uma negociação é solicitada, a plataforma aguarda a confirmação de que o receptor recebeu os valores acordados. O Super Admin recebe um alarme contínuo no sistema e só conclui formalmente a operação após a dupla validação dos intervenientes.',
    },
    {
      q: 'Quanto custa a assinatura Premium e como se paga?',
      a: 'A assinatura Premium tem o valor fixo de 20,00 € por mês. O pagamento é realizado por MB WAY para o número 936924849. Após efetuar o pagamento, basta carregar o comprovativo na área Premium para validação manual do Super Admin.',
    },
    {
      q: 'Utilizadores gratuitos podem utilizar a plataforma?',
      a: 'Sim! Os utilizadores gratuitos podem consultar as cotações oficiais atualizadas, utilizar o conversor de moedas, explorar as ofertas públicas do mercado e submeter solicitações de troca mediadas pela plataforma.',
    },
    {
      q: 'Por que motivo a verificação KYC é obrigatória para negociar?',
      a: 'A verificação de identidade (KYC) garante que todos os membros ativos no mercado são utilizadores legítimos e verificados por documento de identificação (BI, Cartão de Cidadão ou Passaporte), prevenindo fraudes e perfis falsos.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#246BFD] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#246BFD]" />
                <span>EUR · AOA · Marketplace P2P</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] text-balance">
                O mundo das moedas à distância de um clique.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Compre e venda moedas com outros utilizadores, acompanhe as taxas e encontre oportunidades de câmbio numa única plataforma.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-6 py-3 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 group"
                >
                  <span>Explorar Mercado P2P</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('premium')}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Plano Premium (20 €)</span>
                </button>

                <PWAInstallButton />
              </div>

              {/* Trust markers */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800/80 max-w-lg text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">2 Moedas</div>
                  <div className="text-slate-500">EUR & AOA</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">KYC Rigoroso</div>
                  <div className="text-slate-500">Verificação Humana</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">MB WAY</div>
                  <div className="text-slate-500">936924849 (20 €)</div>
                </div>
              </div>
            </div>

            {/* Right Column: Converter Widget */}
            <div className="lg:col-span-5">
              <ConverterWidget onGoToMarketplace={() => onNavigate('marketplace')} />
            </div>
          </div>
        </div>
      </section>

      {/* Live Reference Rates Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Taxas de Câmbio de Referência
              </h3>
              <p className="text-xs text-slate-300">
                Valores configurados pelo Super Admin da plataforma.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Atualizado em tempo real
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {rates.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base text-white">{r.pair}</span>
                  <span className="text-xs font-mono text-slate-400">Ref: {r.referenceRate}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-700/50">
                  <div>
                    <span className="text-slate-400 text-[10px] block">COMPRA</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{r.buyRate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">VENDA</span>
                    <span className="font-bold text-blue-400 tabular-nums">{r.sellRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the P2P Marketplace Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Como Funciona o Marketplace QUICK SEND
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Três passos transparentes para trocar moedas com outros utilizadores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#246BFD] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Consultar ou Publicar Oferta
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Consulte ofertas públicas de compra e venda entre EUR e AOA. Membros Premium com KYC aprovado podem publicar os seus próprios anúncios.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Solicitação & Confirmação de Receção
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O comprador solicita a troca e acerta as condições no chat privado. A plataforma apenas disponibiliza a operação após o receptor confirmar formalmente que recebeu o valor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Validação do Super Admin
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O Super Admin é alertado com um alarme sonoro contínuo no sistema e analisa cada transição no painel CMS, garantindo integridade e registo de auditoria.
            </p>
          </div>
        </div>
      </section>

      {/* Premium Plan Highlight: 20€ / mês */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#101D35] via-[#142342] to-[#0A1222] border border-slate-800 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <Crown className="w-3.5 h-3.5" />
                <span>Assinatura Mensal Exclusiva</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Plano Premium QUICK SEND
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Desbloqueie a publicação de ofertas no marketplace P2P, inicie negociações diretas com outros utilizadores verificados e utilize o chat privado em tempo real.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Publicação de ofertas de compra e venda</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Chat privado direto entre participantes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Notificações sonoras e prioritárias</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Histórico completo de auditoria</span>
                </div>
              </div>
            </div>

            {/* Pricing Box with MB WAY */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4 text-center">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                Assinatura Mensal
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-white font-mono">20,00</span>
                <span className="text-lg font-bold text-slate-300">EUR</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>

              <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-xs text-left space-y-1 font-mono">
                <div className="text-slate-400 text-[11px]">Pagamento por MB WAY:</div>
                <div className="text-base font-bold text-emerald-400 tracking-wider">936924849</div>
                <div className="text-[11px] text-slate-400">Validação manual pelo Super Admin</div>
              </div>

              <button
                onClick={() => onNavigate('premium')}
                className="w-full py-3 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Ativar Assinatura Premium</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Respostas transparentes sobre o funcionamento da plataforma e conformidade.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101D35] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-[#246BFD] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    openFaqIndex === idx ? 'rotate-180 text-[#246BFD]' : 'text-slate-400'
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
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
