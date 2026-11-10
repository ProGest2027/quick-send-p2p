/**
 * Quick Send — User Dashboard
 * Personalized overview of account, Premium & KYC status, 3-currency cards,
 * quick converter, recent exchange requests, and marketplace offers.
 */

import React from 'react';
import {
  User,
  ShieldCheck,
  Crown,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  CreditCard,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../services/database';
import { ConverterWidget } from '../components/ConverterWidget';

interface UserDashboardProps {
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onOpenChat: (participantId: string, requestId?: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onNavigate,
  onOpenChat,
}) => {
  const [editMethodsOpen, setEditMethodsOpen] = React.useState(false);
  const [mbwayPhone, setMbwayPhone] = React.useState(currentUser.paymentMethods?.mbwayPhone || '');
  const [ibanEur, setIbanEur] = React.useState(currentUser.paymentMethods?.ibanEur || '');
  const [expressPhone, setExpressPhone] = React.useState(currentUser.paymentMethods?.expressPhone || '');
  const [ibanAoa, setIbanAoa] = React.useState(currentUser.paymentMethods?.ibanAoa || '');
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const sub = db.getUserSubscription(currentUser.id);
  const kyc = db.getUserKyc(currentUser.id);
  const isPremium = db.isUserPremium(currentUser.id);
  const isKycApproved = db.isUserKycApproved(currentUser.id);

  const rates = db.getRates();
  const allRequests = db.getRequests();

  const handleSaveMethods = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateUserPaymentMethods(currentUser.id, {
      mbwayPhone: mbwayPhone.trim() || undefined,
      ibanEur: ibanEur.trim() || undefined,
      expressPhone: expressPhone.trim() || undefined,
      ibanAoa: ibanAoa.trim() || undefined,
    });
    setFeedback('Métodos de receção de valores atualizados com sucesso!');
    setTimeout(() => {
      setFeedback(null);
      setEditMethodsOpen(false);
    }, 1500);
  };
  const myRequests = allRequests.filter(
    (r) => r.buyerId === currentUser.id || r.sellerId === currentUser.id
  );
  const myOffers = db.getOffers().filter((o) => o.userId === currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#101D35] via-[#1E3A8A] to-[#246BFD] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-blue-200 font-bold">
              Painel Pessoal QUICK SEND
            </span>
            {isSuperAdmin && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500 text-white uppercase">
                Super Admin
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Olá, {currentUser.fullName}!
          </h1>
          <p className="text-xs text-blue-100 max-w-lg leading-relaxed">
            Acompanhe o estado da sua conta, taxas atualizadas e as suas solicitações de câmbio de moedas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Aceder ao Painel CMS</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('marketplace')}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <span>Explorar Mercado P2P</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Verification & Premium Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Account Status Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Estado da Conta</span>
            <User className="w-4 h-4 text-[#246BFD]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {currentUser.isBlocked ? 'Bloqueada' : currentUser.isSuspended ? 'Suspensa' : 'Ativa & Regular'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Registo em: {new Date(currentUser.createdAt).toLocaleDateString('pt-PT')}
          </p>
        </div>

        {/* KYC Status Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Identidade (KYC)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            {isKycApproved ? (
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Aprovado
              </span>
            ) : kyc?.status === 'PENDENTE' ? (
              <span className="text-base font-bold text-amber-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Em Análise
              </span>
            ) : (
              <span className="text-base font-bold text-slate-600 dark:text-slate-400">
                Pendente de Envio
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate('kyc')}
            className="text-[11px] text-[#246BFD] hover:underline font-semibold"
          >
            {isKycApproved ? 'Ver detalhes do documento' : 'Submeter identificação KYC'}
          </button>
        </div>

        {/* Premium Membership Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Assinatura (20 € MB WAY)</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <span className="text-base font-bold text-amber-500 flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> Premium Ativo
              </span>
            ) : sub?.status === 'PENDENTE' ? (
              <span className="text-base font-bold text-blue-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Comprovativo em Análise
              </span>
            ) : (
              <span className="text-base font-bold text-slate-600 dark:text-slate-400">
                Plano Gratuito
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate('premium')}
            className="text-[11px] text-[#246BFD] hover:underline font-semibold"
          >
            {isPremium ? 'Gerir validade e renovação' : 'Ativar plano Premium (20 €)'}
          </button>
        </div>
      </div>

      {/* Métodos de Receção de Valores (Solicitado no Cadastro) */}
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#246BFD]" />
              <span>Os Meus Métodos para Receção de Valores</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Contas e números onde irá receber os pagamentos de contrapartida dos compradores.
            </p>
          </div>
          <button
            onClick={() => setEditMethodsOpen(true)}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#246BFD] dark:bg-blue-950/60 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            Editar Métodos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* MB WAY PT */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
              MB WAY (Portugal)
            </span>
            <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {currentUser.paymentMethods?.mbwayPhone || (
                <span className="text-slate-400 font-normal italic text-xs">Não configurado</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">Para receber em EUR</span>
          </div>

          {/* IBAN PT */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
              IBAN Portugal (EUR)
            </span>
            <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs truncate" title={currentUser.paymentMethods?.ibanEur}>
              {currentUser.paymentMethods?.ibanEur || (
                <span className="text-slate-400 font-normal italic">Não configurado</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">Transferência bancária PT / SEPA</span>
          </div>

          {/* Multicaixa Express AO */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              MULTICAIXA EXPRESS (Angola)
            </span>
            <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {currentUser.paymentMethods?.expressPhone || (
                <span className="text-slate-400 font-normal italic text-xs">Não configurado</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">Para receber em AOA</span>
          </div>

          {/* IBAN AO */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              IBAN Angola (AOA)
            </span>
            <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs truncate" title={currentUser.paymentMethods?.ibanAoa}>
              {currentUser.paymentMethods?.ibanAoa || (
                <span className="text-slate-400 font-normal italic">Não configurado</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">Transferência bancária AO</span>
          </div>
        </div>
      </div>

      {/* 2 Dedicated Currency Cards: EUR & AOA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Cotações Oficiais das Moedas (EUR & AOA)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Última atualização: {new Date(rates[0]?.lastUpdated || Date.now()).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* EUR Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇪🇺</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Euro Europeu</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">EUR</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#246BFD] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                Ref: 989.50 Kz
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">COMPRA (AOA)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  978.00 Kz
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">VENDA (AOA)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  1001.00 Kz
                </span>
              </div>
            </div>
          </div>

          {/* AOA Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇦🇴</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kwanza Angolano</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">AOA</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#246BFD] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                0.00101 €
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">COMPRA (EUR)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  0.00099 €
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">VENDA (EUR)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  0.00102 €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Editar Métodos de Receção */}
      {editMethodsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Atualizar Métodos para Receção de Valores
                </h3>
                <p className="text-[11px] text-slate-500">
                  Defina onde pretende receber o dinheiro das suas trocas no marketplace.
                </p>
              </div>
              <button
                onClick={() => setEditMethodsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 rounded-xl text-xs font-bold text-center">
                {feedback}
              </div>
            )}

            <form onSubmit={handleSaveMethods} className="space-y-4 text-xs">
              {/* Portugal / EUR */}
              <div className="space-y-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <span className="font-bold text-blue-700 dark:text-blue-300 block uppercase text-[10px]">
                  🇪🇺 Portugal / Euro (EUR)
                </span>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-0.5">
                    MB WAY — Telefone Portugal
                  </label>
                  <input
                    type="tel"
                    value={mbwayPhone}
                    onChange={(e) => setMbwayPhone(e.target.value)}
                    placeholder="Ex: 912 345 678"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-0.5">
                    IBAN Portugal (EUR)
                  </label>
                  <input
                    type="text"
                    value={ibanEur}
                    onChange={(e) => setIbanEur(e.target.value)}
                    placeholder="Ex: PT50 0000 0000 0000 0000 0000 0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Angola / AOA */}
              <div className="space-y-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block uppercase text-[10px]">
                  🇦🇴 Angola / Kwanza (AOA)
                </span>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-0.5">
                    MULTICAIXA EXPRESS — Telefone Angola
                  </label>
                  <input
                    type="tel"
                    value={expressPhone}
                    onChange={(e) => setExpressPhone(e.target.value)}
                    placeholder="Ex: 923 456 789"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-0.5">
                    IBAN Angola (AOA)
                  </label>
                  <input
                    type="text"
                    value={ibanAoa}
                    onChange={(e) => setIbanAoa(e.target.value)}
                    placeholder="Ex: AO06 0000 0000 0000 0000 0000 0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditMethodsOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Guardar Métodos de Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid: Quick Converter & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <ConverterWidget onGoToMarketplace={() => onNavigate('marketplace')} compact={true} />
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                As Minhas Operações Recentes
              </h3>
              <p className="text-[11px] text-slate-400">Solicitações de compra e venda em curso</p>
            </div>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs text-[#246BFD] hover:underline font-semibold"
            >
              Ver todas ({myRequests.length})
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs space-y-2">
              <ArrowLeftRight className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p>Ainda não iniciou nenhuma solicitação de câmbio.</p>
              <button
                onClick={() => onNavigate('marketplace')}
                className="px-3 py-1.5 bg-[#246BFD] text-white rounded-lg text-xs font-bold"
              >
                Procurar Ofertas no Mercado
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white font-mono">
                      {r.amount} {r.offerCurrency} &rarr; {r.estimatedValue} {r.receiveCurrency}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Parceiro: {r.buyerId === currentUser.id ? r.sellerName : r.buyerName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                      {r.status}
                    </span>
                    <button
                      onClick={() => onOpenChat(r.buyerId === currentUser.id ? r.sellerId : r.buyerId, r.id)}
                      className="p-1.5 text-slate-500 hover:text-[#246BFD]"
                      title="Abrir chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
