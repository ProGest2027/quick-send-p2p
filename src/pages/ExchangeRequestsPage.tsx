/**
 * Quick Send — Exchange Requests Management Page
 * Handles the complete lifecycle of P2P operations, receiver confirmation ("Confirmar que recebi"),
 * continuous Super Admin alarm triggering, chat opening, and reporting.
 */

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  FileText,
  DollarSign,
  User,
  Phone,
  AlertCircle,
  Flag,
  Copy,
  Check,
} from 'lucide-react';
import { UserProfile, ExchangeRequest } from '../types';
import { db } from '../services/database';

interface ExchangeRequestsPageProps {
  currentUser: UserProfile;
  onOpenChat: (participantId: string, requestId?: string, offerId?: string) => void;
  onOpenReportModal: (targetUserId: string, requestId?: string) => void;
}

export const ExchangeRequestsPage: React.FC<ExchangeRequestsPageProps> = ({
  currentUser,
  onOpenChat,
  onOpenReportModal,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2500);
  };

  const allRequests = db.getRequests();
  // Filter for requests where current user is buyer or seller (or all if Super Admin)
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const myRequests = allRequests.filter((r) => {
    if (isSuperAdmin) return true;
    return r.buyerId === currentUser.id || r.sellerId === currentUser.id;
  });

  const filteredRequests = myRequests.filter((r) => {
    if (filterTab === 'ACTIVE') {
      return !['CONCLUIDA', 'CANCELADA', 'REJEITADA'].includes(r.status);
    }
    if (filterTab === 'COMPLETED') {
      return ['CONCLUIDA', 'CANCELADA', 'REJEITADA'].includes(r.status);
    }
    return true;
  });

  const handleConfirmReceived = (requestId: string) => {
    const res = db.confirmReceiptByReceiver(requestId, currentUser.id);
    setActionFeedback(res.message);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const getStatusBadge = (status: ExchangeRequest['status']) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">Aguardando Aprovação Admin</span>;
      case 'EM_ANALISE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">Em Análise pelo Admin</span>;
      case 'APROVADA':
      case 'EM_NEGOCIACAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200">Em Negociação Direta</span>;
      case 'AGUARDANDO_PAGAMENTO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200">Aguardando Pagamento</span>;
      case 'RECEBIMENTO_CONFIRMADO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse font-mono">Recebimento Confirmado (Alarme Disparado)</span>;
      case 'CONCLUIDA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">Operação Concluída</span>;
      case 'CANCELADA':
      case 'REJEITADA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">Rejeitada / Cancelada</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Solicitações & Operações de Câmbio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe o estado das suas negociações em curso, confirmações de receção e mediação do Super Admin.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({myRequests.length})
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Em Curso
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterTab === 'COMPLETED'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Special platform instruction card */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        <ShieldCheck className="w-5 h-5 text-[#246BFD] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900 dark:text-white">
            Regra Fundamental de Disponibilização & Alarme do Admin:
          </div>
          <p className="leading-relaxed opacity-90 text-[11px]">
            A plataforma só disponibiliza e conclui formalmente uma negociação de câmbio após o receptor confirmar que recebeu os fundos acordados. Quando a confirmação é submetida, o Super Admin recebe um alarme sonoro contínuo no sistema e procede à libertação final.
          </p>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Nenhuma solicitação registada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quando solicitar ou receber propostas no mercado P2P, todo o acompanhamento aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isBuyer = req.buyerId === currentUser.id;
            const otherPartyName = isBuyer ? req.sellerName : req.buyerName;
            const otherPartyPhone = isBuyer ? req.sellerPhone : req.buyerPhone;
            const otherPartyId = isBuyer ? req.sellerId : req.buyerId;

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-bold text-slate-400">
                      ID: {req.id}
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(req.createdAt).toLocaleDateString('pt-PT')} às{' '}
                    {new Date(req.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Parceiro de Negociação</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {otherPartyName}
                    </span>
                    <span className="text-slate-500 block text-[11px]">{otherPartyPhone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Quantia Solicitada</span>
                    <span className="font-bold font-mono text-base text-slate-900 dark:text-white tabular-nums">
                      {req.amount} {req.offerCurrency}
                    </span>
                    <span className="text-[11px] text-[#246BFD] font-mono">
                      Taxa: 1 {req.offerCurrency} = {req.agreedRate} {req.receiveCurrency}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Total a Transferir</span>
                    <span className="font-bold font-mono text-base text-slate-900 dark:text-white tabular-nums">
                      {req.estimatedValue} {req.receiveCurrency}
                    </span>
                    <span className="text-slate-500 block text-[11px]">Método: {req.paymentMethod}</span>
                  </div>

                  <div className="flex flex-col justify-end items-start sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenChat(otherPartyId, req.id, req.offerId)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#246BFD] dark:bg-blue-950/60 dark:text-blue-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Abrir Chat Privado</span>
                      </button>

                      <button
                        onClick={() => onOpenReportModal(otherPartyId, req.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Denunciar irregularidade nesta operação"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Receiver Payout Coordinates Strip */}
                {req.receiverPaymentDetails ? (
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Coordenadas de Receção ({req.receiveCurrency}):</span>
                        <span className="text-[#246BFD] font-mono">{req.receiverPaymentDetails.label}</span>
                      </span>
                      <div className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 tracking-wider">
                        {req.receiverPaymentDetails.value}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(req.receiverPaymentDetails!.value)}
                      className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      {copiedValue === req.receiverPaymentDetails.value ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Coordenadas de pagamento: Combinar via Chat Privado ou Telefone ({otherPartyPhone}).</span>
                    <button
                      onClick={() => onOpenChat(otherPartyId, req.id, req.offerId)}
                      className="text-[#246BFD] font-bold hover:underline ml-2 shrink-0"
                    >
                      Enviar no Chat
                    </button>
                  </div>
                )}

                {/* Receiver confirmation strip */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Confirmação de Receção:</span>
                    {req.receiverConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmado pelo receptor</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Clock className="w-4 h-4" />
                        <span>Ainda não confirmada</span>
                      </span>
                    )}
                  </div>

                  {/* Confirmation Button for receiver if not yet confirmed */}
                  {!req.receiverConfirmed && req.status !== 'CANCELADA' && req.status !== 'REJEITADA' && (
                    <button
                      onClick={() => handleConfirmReceived(req.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar que Recebi os Fundos</span>
                    </button>
                  )}
                </div>

                {/* History timeline notes */}
                {req.statusHistory && req.statusHistory.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-500">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Registo de Auditoria da Operação:
                    </div>
                    {req.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-mono text-slate-400 shrink-0">
                          {new Date(h.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{h.status}:</span>
                        <span>{h.note || 'Atualização de estado'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
