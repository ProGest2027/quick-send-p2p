/**
 * Quick Send — Premium Membership Page (20 € / mês por MB WAY: 936924849)
 * Handles subscription status, MB WAY instructions, copy button,
 * proof upload with preview, and status progression.
 */

import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  ShieldCheck,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { UserProfile, PremiumSubscription } from '../types';
import { db } from '../services/database';

interface PremiumPageProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigate: (tab: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ currentUser, onOpenAuth, onNavigate }) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [senderPhone, setSenderPhone] = useState(currentUser?.phoneNumber || '');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const MBWAY_PHONE = '936924849';
  const MONTHLY_PRICE = '20,00 EUR';

  const userSub = currentUser ? db.getUserSubscription(currentUser.id) : undefined;
  const isPremiumActive = currentUser ? db.isUserPremium(currentUser.id) : false;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(MBWAY_PHONE);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'O ficheiro não deve exceder 5MB.' });
      return;
    }

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    if (!paymentRef.trim()) {
      setFeedback({ type: 'error', message: 'Introduza a referência ou nome do titular que efetuou a transferência.' });
      return;
    }

    if (!proofPreview) {
      setFeedback({ type: 'error', message: 'Por favor carregue o ficheiro ou captura de ecrã do comprovativo MB WAY.' });
      return;
    }

    setIsSubmitting(true);
    const res = db.submitPremiumPayment(
      currentUser.id,
      paymentRef,
      senderPhone,
      proofPreview,
      proofFileName
    );
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Comprovativo MB WAY submetido com sucesso! O Super Admin irá analisar e ativar a sua conta por 30 dias.',
      });
      setPaymentRef('');
      setProofPreview(null);
      setProofFileName('');
    } else {
      setFeedback({ type: 'error', message: res.message || 'Falha ao submeter comprovativo.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
          <Crown className="w-3.5 h-3.5" />
          <span>Assinatura Mensal Exclusiva</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Plano Premium QUICK SEND
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Acesso ilimitado ao marketplace P2P, publicação de ofertas e chat privado com suporte do Super Admin.
        </p>
      </div>

      {/* Current Subscription Status Badge */}
      {currentUser && userSub && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            userSub.status === 'APROVADO' && isPremiumActive
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : userSub.status === 'PENDENTE'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : userSub.status === 'REJEITADO'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            {userSub.status === 'APROVADO' && isPremiumActive ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : userSub.status === 'PENDENTE' ? (
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : userSub.status === 'REJEITADO' ? (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm">
                Estado da Assinatura:{' '}
                {userSub.status === 'APROVADO' && isPremiumActive
                  ? 'Premium Ativo (30 Dias)'
                  : userSub.status === 'PENDENTE'
                  ? 'Comprovativo em Análise Manual pelo Super Admin'
                  : userSub.status === 'REJEITADO'
                  ? 'Comprovativo Recusado'
                  : 'Assinatura Expirada'}
              </div>
              {userSub.expiresDate && (
                <div className="font-mono text-xs">
                  Válido até: {new Date(userSub.expiresDate).toLocaleDateString('pt-PT')} às{' '}
                  {new Date(userSub.expiresDate).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {userSub.rejectionReason && (
                <div className="text-rose-600 dark:text-rose-400 font-semibold pt-1">
                  Motivo da recusa: {userSub.rejectionReason}
                </div>
              )}
            </div>
          </div>

          {userSub.status === 'APROVADO' && isPremiumActive && (
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
            >
              Ir para o Mercado P2P
            </button>
          )}
        </div>
      )}

      {/* Comparison Grid: Free vs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Utilizador Gratuito</h3>
              <p className="text-xs text-slate-500">Para consulta e solicitações básicas</p>
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">0,00 €</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Registo e autenticação segura</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Acesso ao conversor oficial de 3 moedas</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Consulta de taxas de referência em tempo real</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Visualização de ofertas públicas no mercado</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Solicitação de câmbio mediada pela plataforma</span>
            </li>
          </ul>
        </div>

        {/* Premium Plan Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-white dark:via-[#101D35] to-white dark:to-[#101D35] border-2 border-amber-500/40 relative space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Membro Premium</h3>
              </div>
              <p className="text-xs text-slate-500">Acesso completo para negociadores</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">20,00 €</span>
              <span className="text-[10px] text-slate-500 block">/ 30 dias</span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Tudo do plano gratuito incluído</span>
            </li>
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Publicação de anúncios de compra e venda (EUR, AOA)</span>
            </li>
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Chat privado direto com outros utilizadores</span>
            </li>
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Selo verificado de membro Premium no perfil</span>
            </li>
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Acompanhamento prioritário de operações</span>
            </li>
          </ul>
        </div>
      </div>

      {/* MB WAY Payment Box & Proof Submission Form */}
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#246BFD]" />
            <span>Instruções de Pagamento MB WAY</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Transfira a quantia mensal por MB WAY e anexe o comprovativo emitido pelo seu banco.
          </p>
        </div>

        {/* MB WAY Information Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Número MB WAY</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-black font-mono text-slate-900 dark:text-white tracking-wider">
                {MBWAY_PHONE}
              </span>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="p-1.5 text-[#246BFD] hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors"
                title="Copiar número"
              >
                {copiedPhone ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Valor Exato</span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {MONTHLY_PRICE}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Duração</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              30 Dias Contínuos
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitProof} className="space-y-4 pt-2">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referência / Nome do Titular que enviou
              </label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Ex: João Pedro Silva ou ID MB WAY"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de Telemóvel de Origem
              </label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Ex: 912 345 678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
              />
            </div>
          </div>

          {/* Proof upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Carregar Comprovativo MB WAY (Ficheiro / Imagem)
            </label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#246BFD] rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#246BFD] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {proofFileName ? proofFileName : 'Clique ou arraste o comprovativo aqui'}
                </div>
                <p className="text-[11px] text-slate-400">Formatos aceites: JPG, PNG, PDF (Máx. 5MB)</p>
              </div>
            </div>

            {proofPreview && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img
                  src={proofPreview}
                  alt="Pré-visualização do comprovativo"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">Comprovativo Carregado</div>
                  <div className="text-[11px] text-slate-400">{proofFileName}</div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            {!currentUser ? (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="w-full py-3 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Inicie Sessão para Ativar Premium
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'A Enviar Comprovativo...' : 'Enviar Comprovativo para Aprovação'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
