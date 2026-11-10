/**
 * Quick Send — Super Admin CMS Dashboard
 * Complete backoffice panel for user management, exchange rates configuration,
 * MB WAY payment approvals, KYC document validation, exchange request mediation,
 * fraud reports, audit logs, and continuous sound alarm controls.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  CreditCard,
  FileCheck,
  TrendingUp,
  ArrowLeftRight,
  Flag,
  FileText,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Lock,
  Unlock,
  Edit2,
  Save,
  Search,
  BellRing,
  ExternalLink,
} from 'lucide-react';
import {
  UserProfile,
  ExchangeRate,
  PremiumSubscription,
  KYCDocument,
  ExchangeRequest,
  ReportItem,
  AuditLogItem,
  P2POffer,
} from '../types';
import { db } from '../services/database';
import { soundAlarmService } from '../services/soundAlarm';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onOpenChat: (targetUserId: string, requestId?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigate,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'rates' | 'payments' | 'kyc' | 'requests' | 'offers' | 'reports' | 'audit'
  >('overview');

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [editRefRate, setEditRefRate] = useState<string>('');
  const [editBuyRate, setEditBuyRate] = useState<string>('');
  const [editSellRate, setEditSellRate] = useState<string>('');

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<KYCDocument | null>(null);
  const [viewingPaymentProof, setViewingPaymentProof] = useState<PremiumSubscription | null>(null);

  // Status prompt dialog
  const [rejectionModal, setRejectionModal] = useState<{
    type: 'KYC' | 'PAYMENT' | 'REQUEST';
    id: string;
  } | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Audio status
  const [alarmActive, setAlarmActive] = useState(soundAlarmService.isRunning());
  const [isMuted, setIsMuted] = useState(soundAlarmService.getIsMuted());

  // Real Database queries
  const users = db.getUsers();
  const rates = db.getRates();
  const rateHistory = db.getRateHistory();
  const subscriptions = db.getSubscriptions();
  const kycs = db.getKycSubmissions();
  const requests = db.getRequests();
  const offers = db.getOffers();
  const reports = db.getReports();
  const auditLogs = db.getAuditLogs();

  // Urgent counts
  const pendingPayments = subscriptions.filter((s) => s.status === 'PENDENTE');
  const pendingKycs = kycs.filter((k) => k.status === 'PENDENTE');
  const pendingRequests = requests.filter(
    (r) => r.needsAdminAttention || r.status === 'RECEBIMENTO_CONFIRMADO' || r.status === 'PENDENTE'
  );
  const openReports = reports.filter((r) => r.status === 'NOVA' || r.status === 'EM_ANALISE');

  const handleTestAlarm = () => {
    soundAlarmService.unlockAudio();
    soundAlarmService.playAlertChime();
  };

  const handleToggleAlarmMute = () => {
    const muted = soundAlarmService.toggleMute();
    setIsMuted(muted);
  };

  const handleSilenceAlarm = () => {
    soundAlarmService.stopAlarm();
    setAlarmActive(false);
  };

  // Rates edit
  const handleStartEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setEditRefRate(String(rate.referenceRate));
    setEditBuyRate(String(rate.buyRate));
    setEditSellRate(String(rate.sellRate));
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    const ref = parseFloat(editRefRate);
    const buy = parseFloat(editBuyRate);
    const sell = parseFloat(editSellRate);

    if (isNaN(ref) || isNaN(buy) || isNaN(sell)) return;

    db.updateRate(editingRate.id, ref, buy, sell, currentUser.id, currentUser.email);
    setEditingRate(null);
  };

  // Payment approval
  const handleApprovePayment = (subId: string) => {
    db.reviewPremiumPayment(subId, 'APPROVE', currentUser.id, currentUser.email);
    soundAlarmService.stopAlarm();
  };

  const handleRejectPayment = (subId: string, reason: string) => {
    db.reviewPremiumPayment(subId, 'REJECT', currentUser.id, currentUser.email, reason);
    soundAlarmService.stopAlarm();
  };

  // KYC review
  const handleApproveKyc = (kycId: string) => {
    db.reviewKyc(kycId, 'APPROVE', currentUser.id, currentUser.email);
    setViewingDoc(null);
    soundAlarmService.stopAlarm();
  };

  const handleRejectKyc = (kycId: string, reason: string) => {
    db.reviewKyc(kycId, 'REJECT', currentUser.id, currentUser.email, reason);
    setViewingDoc(null);
    soundAlarmService.stopAlarm();
  };

  // Request status update
  const handleUpdateRequestStatus = (requestId: string, status: ExchangeRequest['status']) => {
    db.updateRequestStatusByAdmin(
      requestId,
      status,
      currentUser.id,
      currentUser.email,
      `Atualização formal efetuada pelo Super Admin no CMS.`
    );
    soundAlarmService.stopAlarm();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top CMS Header with Audio Alarm Control Console */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Painel CMS — Acesso Exclusivo Super Admin</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Gestão Central da Plataforma QUICK SEND
          </h1>
          <p className="text-xs text-slate-400">
            Sessão administrativa autenticada: <span className="text-white font-mono">{currentUser.email}</span>
          </p>
        </div>

        {/* Audio Siren & Alert Controls */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold flex items-center gap-1.5 text-slate-300">
              <BellRing className={`w-4 h-4 ${alarmActive ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
              <span>Sistema de Alarme Admin:</span>
            </span>
            <span
              className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                alarmActive ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {alarmActive ? 'A TOCAR (PENDÊNCIAS)' : 'SILENCIOSO'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestAlarm}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Testar Som
            </button>
            <button
              onClick={handleToggleAlarmMute}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? 'Desmutar' : 'Silenciar'}</span>
            </button>
            {alarmActive && (
              <button
                onClick={handleSilenceAlarm}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white transition-colors shadow-xs"
              >
                Parar Alarme
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CMS Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Visão Geral & KPIs
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'requests'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Operações & Câmbio</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-mono">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'payments'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Pagamentos MB WAY</span>
          {pendingPayments.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-mono">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'kyc'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Validações KYC</span>
          {pendingKycs.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-mono">
              {pendingKycs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'rates'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Gestão de Taxas
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Utilizadores ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'offers'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Anúncios P2P ({offers.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'reports'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Denúncias</span>
          {openReports.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-mono">
              {openReports.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#246BFD] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Histórico de Auditoria
        </button>
      </div>

      {/* TAB 1: OVERVIEW & REAL STATISTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Utilizadores</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">{users.length}</div>
              <span className="text-[10px] text-emerald-500 font-medium">Cadastrados no sistema</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Membros Premium</span>
              <div className="text-2xl font-black font-mono text-amber-500 tabular-nums">
                {users.filter((u) => db.isUserPremium(u.id)).length}
              </div>
              <span className="text-[10px] text-slate-400">20 € / mês ativo</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pagamentos MB WAY</span>
              <div className="text-2xl font-black font-mono text-rose-500 tabular-nums">{pendingPayments.length}</div>
              <span className="text-[10px] text-rose-400 font-medium">Aguardam aprovação</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KYC Pendentes</span>
              <div className="text-2xl font-black font-mono text-blue-500 tabular-nums">{pendingKycs.length}</div>
              <span className="text-[10px] text-blue-400 font-medium">Análise de identidade</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operações P2P</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">{requests.length}</div>
              <span className="text-[10px] text-emerald-500 font-medium">
                {requests.filter((r) => r.status === 'CONCLUIDA').length} concluídas
              </span>
            </div>
          </div>

          {/* Quick Alert list for pending items */}
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Pendências Imediatas com Alarme Contínuo</span>
            </h3>

            {pendingRequests.length === 0 && pendingPayments.length === 0 && pendingKycs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Tudo regularizado. Nenhuma operação requer a sua atenção no momento.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-rose-900 dark:text-rose-200">
                        {r.status === 'RECEBIMENTO_CONFIRMADO'
                          ? `🚨 Recebimento confirmado por ${r.sellerName}`
                          : `🚨 Nova solicitação de ${r.amount} ${r.offerCurrency}`}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Comprador: {r.buyerName} &bull; Vendedor: {r.sellerName}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
                    >
                      Examinar
                    </button>
                  </div>
                ))}

                {pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Comprovativo MB WAY de 20 € submetido por {p.userName}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">Ref: {p.paymentReference}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold"
                    >
                      Validar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OPERAÇÕES & CÂMBIO (EXCHANGE REQUESTS MEDIATION) */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Mediação Administrativa de Solicitações
              </h3>
              <p className="text-xs text-slate-400">
                Aprovação, cancelamento e conclusão após confirmação de recebimento.
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Sem solicitações no sistema.</div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{req.id}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        {req.status}
                      </span>
                      {req.receiverConfirmed && (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          Receptor Confirmou Receção
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono">
                      {new Date(req.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Comprador</span>
                      <span className="font-bold text-slate-900 dark:text-white">{req.buyerName}</span>
                      <span className="text-slate-500 block">{req.buyerPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Vendedor</span>
                      <span className="font-bold text-slate-900 dark:text-white">{req.sellerName}</span>
                      <span className="text-slate-500 block">{req.sellerPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Quantia & Valor</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {req.amount} {req.offerCurrency} &rarr; {req.estimatedValue} {req.receiveCurrency}
                      </span>
                      <span className="text-slate-500 block">Método: {req.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Actions for Admin */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenChat(req.buyerId, req.id)}
                      className="text-[#246BFD] font-bold hover:underline"
                    >
                      Aceder ao Chat da Operação
                    </button>

                    <div className="flex items-center gap-2">
                      {req.status !== 'APROVADA' && req.status !== 'CONCLUIDA' && (
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'APROVADA')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                        >
                          Aprovar Mediação
                        </button>
                      )}

                      {req.receiverConfirmed && req.status !== 'CONCLUIDA' && (
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'CONCLUIDA')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Concluir Operação Formalmente
                        </button>
                      )}

                      {req.status !== 'REJEITADA' && req.status !== 'CONCLUIDA' && (
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'REJEITADA')}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Rejeitar / Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAGAMENTOS MB WAY (20€/MÊS) */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Aprovações de Pagamento MB WAY (936924849 — 20,00 €)
              </h3>
              <p className="text-xs text-slate-400">
                Verifique o comprovativo e aprove manualmente para conceder 30 dias de acesso Premium.
              </p>
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Sem comprovativos submetidos.</div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{sub.userName}</span>
                      <span className="text-slate-400 font-mono text-xs">({sub.userEmail})</span>
                    </div>
                    <div className="text-slate-500">
                      Ref: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{sub.paymentReference}</span> &bull; Tel:{' '}
                      {sub.senderPhone || 'N/A'} &bull; Submetido:{' '}
                      {new Date(sub.submittedAt).toLocaleDateString('pt-PT')}
                    </div>
                    <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Valor: {sub.amount} {sub.currency} por MB WAY
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.proofDataUrl && (
                      <button
                        onClick={() => setViewingPaymentProof(sub)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Comprovativo</span>
                      </button>
                    )}

                    {sub.status === 'PENDENTE' && (
                      <>
                        <button
                          onClick={() => handleApprovePayment(sub.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Aprovar (30 Dias)
                        </button>
                        <button
                          onClick={() => handleRejectPayment(sub.id, 'Comprovativo ilegível ou montante não recebido')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Rejeitar
                        </button>
                      </>
                    )}

                    {sub.status === 'APROVADO' && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold">
                        Aprovado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VALIDAÇÕES KYC */}
      {activeTab === 'kyc' && (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Validações de Documentos KYC
              </h3>
              <p className="text-xs text-slate-400">
                Aprovação de Bilhete de Identidade, Cartão de Cidadão e Passaporte para conformidade.
              </p>
            </div>
          </div>

          {kycs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Nenhum documento KYC submetido.</div>
          ) : (
            <div className="space-y-3">
              {kycs.map((item) => {
                const user = users.find((u) => u.id === item.userId);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {user?.fullName || 'Utilizador'}
                      </div>
                      <div className="text-slate-500">
                        Tipo: <span className="font-bold text-slate-800 dark:text-slate-200">{item.documentType}</span> &bull; N.º:{' '}
                        {item.documentNumber || 'N/A'} &bull; Data:{' '}
                        {new Date(item.submittedAt).toLocaleDateString('pt-PT')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingDoc(item)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Documentos</span>
                      </button>

                      {item.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => handleApproveKyc(item.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            Aprovar KYC
                          </button>
                          <button
                            onClick={() => handleRejectKyc(item.id, 'Documento ilegível ou cortado')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}

                      {item.status === 'APROVADO' && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold">
                          Aprovado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GESTÃO DE TAXAS */}
      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Configuração de Taxas Oficiais (EUR, AOA)
              </h3>
              <p className="text-xs text-slate-400">
                Altere a taxa de referência, compra e venda. Todas as modificações geram histórico de auditoria.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Par</th>
                  <th className="py-2.5">Taxa Referência</th>
                  <th className="py-2.5">Taxa de Compra</th>
                  <th className="py-2.5">Taxa de Venda</th>
                  <th className="py-2.5">Última Atualização</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rates.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{r.pair}</td>
                    <td className="py-3 font-mono font-bold text-[#246BFD]">{r.referenceRate}</td>
                    <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{r.buyRate}</td>
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400 font-semibold">{r.sellRate}</td>
                    <td className="py-3 text-slate-400 font-mono">
                      {new Date(r.lastUpdated).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleStartEditRate(r)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit rate form */}
          {editingRate && (
            <form onSubmit={handleSaveRate} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                Editar Taxa do Par: {editingRate.pair}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Referência</label>
                  <input
                    type="number"
                    step="any"
                    value={editRefRate}
                    onChange={(e) => setEditRefRate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Taxa Compra</label>
                  <input
                    type="number"
                    step="any"
                    value={editBuyRate}
                    onChange={(e) => setEditBuyRate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Taxa Venda</label>
                  <input
                    type="number"
                    step="any"
                    value={editSellRate}
                    onChange={(e) => setEditSellRate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="px-3 py-1 text-slate-500 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#246BFD] text-white rounded-lg text-xs font-bold"
                >
                  Guardar Nova Taxa
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 6: UTILIZADORES */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Gestão e Moderação de Contas
              </h3>
              <p className="text-xs text-slate-400">
                Bloqueio, suspensão temporária e consulta de perfis.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {users.map((u) => {
              const userPremium = db.isUserPremium(u.id);
              const userKyc = db.isUserKycApproved(u.id);
              const isSuper = u.role === 'SUPER_ADMIN';

              return (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{u.fullName}</span>
                      {isSuper && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[10px] font-black">
                          SUPER ADMIN
                        </span>
                      )}
                      {userPremium && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-bold">
                          PREMIUM
                        </span>
                      )}
                      {userKyc && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-bold">
                          KYC
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {u.email} &bull; {u.phoneNumber || 'Sem telefone'} &bull; Desde:{' '}
                      {new Date(u.createdAt).toLocaleDateString('pt-PT')}
                    </div>
                  </div>

                  {!isSuper && (
                    <div className="flex items-center gap-2">
                      {u.isBlocked ? (
                        <button
                          onClick={() => db.updateUserStatus(u.id, 'UNBLOCK', 'Revisão aprovada', currentUser.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => db.updateUserStatus(u.id, 'BLOCK', 'Violação das regras do marketplace', currentUser.id)}
                          className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
                        >
                          Bloquear Conta
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: HISTÓRICO DE AUDITORIA */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Registo Imutável de Auditoria (Audit Logs)
              </h3>
              <p className="text-xs text-slate-400">
                Registo de todas as ações administrativas, alterações de taxas, aprovações e bloqueios.
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString('pt-PT')}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {log.details}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Responsável: {log.performedByEmail || log.performedBy} &bull; Categoria: {log.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Documentos KYC: {viewingDoc.documentType} (N.º {viewingDoc.documentNumber})
              </h3>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {viewingDoc.frontDataUrl && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Frente</span>
                  <img src={viewingDoc.frontDataUrl} alt="Frente do Documento" className="max-h-64 object-contain rounded-xl border mx-auto" />
                </div>
              )}
              {viewingDoc.backDataUrl && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Verso</span>
                  <img src={viewingDoc.backDataUrl} alt="Verso do Documento" className="max-h-64 object-contain rounded-xl border mx-auto" />
                </div>
              )}
              {viewingDoc.selfieDataUrl && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Selfie</span>
                  <img src={viewingDoc.selfieDataUrl} alt="Selfie com Documento" className="max-h-64 object-contain rounded-xl border mx-auto" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleRejectKyc(viewingDoc.id, 'Documento ilegível')}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Rejeitar
              </button>
              <button
                onClick={() => handleApproveKyc(viewingDoc.id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Aprovar Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT PROOF VIEWER MODAL */}
      {viewingPaymentProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Comprovativo MB WAY: {viewingPaymentProof.userName} (20,00 €)
              </h3>
              <button onClick={() => setViewingPaymentProof(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {viewingPaymentProof.proofDataUrl && (
              <img
                src={viewingPaymentProof.proofDataUrl}
                alt="Comprovativo MB WAY"
                className="w-full max-h-80 object-contain rounded-xl border border-slate-200 dark:border-slate-700"
              />
            )}

            <div className="text-xs text-slate-500 space-y-1">
              <div>Ref: <span className="font-bold text-slate-900 dark:text-white">{viewingPaymentProof.paymentReference}</span></div>
              <div>Telemóvel: {viewingPaymentProof.senderPhone || 'N/A'}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  handleRejectPayment(viewingPaymentProof.id, 'Comprovativo inválido');
                  setViewingPaymentProof(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Rejeitar
              </button>
              <button
                onClick={() => {
                  handleApprovePayment(viewingPaymentProof.id);
                  setViewingPaymentProof(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Aprovar Assinatura Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
