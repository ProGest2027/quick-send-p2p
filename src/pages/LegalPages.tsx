/**
 * Quick Send — Compliance & Legal Modals
 * Termos e Condições, Política de Privacidade e Política de Cookies
 */

import React from 'react';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalModalProps {
  page: 'terms' | 'privacy' | 'cookies' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ page, onClose }) => {
  if (!page) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#246BFD]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {page === 'terms'
                ? 'Termos e Condições de Utilização'
                : page === 'privacy'
                ? 'Política de Privacidade & Proteção de Dados (RGPD)'
                : 'Política de Cookies'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
          {page === 'terms' && (
            <>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Objeto e Natureza da Plataforma</h4>
              <p>
                A QUICK SEND é uma plataforma tecnológica de marketplace entre utilizadores particulares (P2P) destinada à publicação de anúncios de compra e venda de moedas estrangeiras (Euro - EUR e Kwanza angolano - AOA). A plataforma atua exclusivamente como intermediária na disponibilização de anúncios e canal de contacto privado.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Ausência de Custódia de Fundos</h4>
              <p>
                A QUICK SEND não é uma instituição de crédito, instituição de pagamento ou sociedade corretora de valores. A plataforma não recebe depósitos, não efetua custódia de fundos e não processa transferências bancárias em nome dos utilizadores. Todas as transferências de moedas são acordadas e executadas diretamente entre os utilizadores.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Regra Especial de Primeiro Cadastro</h4>
              <p>
                Por determinação arquitetural, o primeiro utilizador registado na plataforma assume a função de SUPER_ADMIN, responsável pela mediação de propostas, aprovação de KYC e conformidade. Utilizadores subsequentes são categorizados como utilizadores comuns (USER).
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Assinatura Premium & Pagamento MB WAY</h4>
              <p>
                A publicação de anúncios no marketplace e o acesso ao chat privado exigem assinatura Premium no valor de 20,00 EUR por mês, paga por MB WAY para o número 936924849, sujeita a aprovação manual pelo Super Admin.
              </p>
            </>
          )}

          {page === 'privacy' && (
            <>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Recolha e Finalidade dos Dados (KYC)</h4>
              <p>
                Para cumprimento das normas de prevenção de branqueamento de capitais (AML) e segurança dos utilizadores, a plataforma recolhe cópia de documentos de identificação (Bilhete de Identidade, Cartão de Cidadão ou Passaporte) e dados de contacto. Estes dados são utilizados unicamente para validação pelo Super Admin.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Segurança e Armazenamento</h4>
              <p>
                Todos os documentos carregados são mantidos em armazenamento protegido com Row Level Security (RLS) e não possuem links públicos indexáveis. Apenas o próprio utilizador e o Super Admin têm acesso aos dados submetidos.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Direitos do Titular dos Dados</h4>
              <p>
                O utilizador tem o direito de aceder, retificar ou solicitar a eliminação dos seus dados nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD).
              </p>
            </>
          )}

          {page === 'cookies' && (
            <>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Utilização de Cookies e Armazenamento Local</h4>
              <p>
                A QUICK SEND utiliza exclusivamente cookies técnicos essenciais e armazenamento local (localStorage) para gestão segura da sessão de autenticação, preferências de tema (claro/escuro) e persistência de dados. Não utilizamos cookies de rastreamento de terceiros para publicidade comportamental.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#246BFD] text-white rounded-xl text-xs font-semibold"
          >
            Compreendi e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
