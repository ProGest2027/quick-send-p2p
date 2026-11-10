/**
 * Quick Send — Footer Component
 * Slogan, non-custodial disclaimer, MB WAY notice, and compliance links
 */

import React from 'react';
import { ArrowLeftRight, ShieldCheck, Lock, Mail, Phone, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenLegal: (page: 'terms' | 'privacy' | 'cookies') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1323] text-slate-600 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Slogan */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#101D35] via-[#246BFD] to-[#16A36A] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#101D35] rounded-[9px] flex items-center justify-center text-white">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#246BFD]" />
                </div>
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                QUICK<span className="text-[#246BFD]">SEND</span>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 italic">
              "O mundo das moedas à distância de um clique."
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Plataforma de intermediação e marketplace peer-to-peer (P2P) de câmbio de moedas entre utilizadores (EUR, AOA).
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Plataforma
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-[#246BFD] transition-colors">
                  Mercado P2P
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('converter')} className="hover:text-[#246BFD] transition-colors">
                  Conversor de Moedas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('premium')} className="hover:text-[#246BFD] transition-colors">
                  Plano Premium (20 € MB WAY)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('kyc')} className="hover:text-[#246BFD] transition-colors">
                  Verificação KYC
                </button>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Conformidade
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onOpenLegal('terms')} className="hover:text-[#246BFD] transition-colors">
                  Termos e Condições
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('privacy')} className="hover:text-[#246BFD] transition-colors">
                  Política de Privacidade & RGPD
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('cookies')} className="hover:text-[#246BFD] transition-colors">
                  Política de Cookies
                </button>
              </li>
              <li>
                <span className="text-[11px] text-slate-400">MB WAY: 936924849 (20,00 €)</span>
              </li>
            </ul>
          </div>

          {/* Security & Non-custodial statement */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Aviso Regulamentar</span>
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              A QUICK SEND atua como marketplace de anúncios e intermediação de propostas entre particulares. Não somos instituição bancária, não custodiamos depósitos nem movimentamos fundos automaticamente.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} QUICK SEND. Todos os direitos reservados. Moeda de referência: EUR.
          </div>
          <div className="flex items-center gap-4">
            <span>EUR · AOA</span>
            <span>·</span>
            <span>Portugal & Angola</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
