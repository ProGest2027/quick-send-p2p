/**
 * Quick Send — P2P Currency Exchange Marketplace
 * Lists buy/sell listings across EUR and AOA.
 * Provides filters, sorting, offer creation modal (gated by Premium + KYC),
 * and exchange request modal.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Crown,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
  X,
  CreditCard,
  MapPin,
  CheckCircle2,
  Lock,
  Landmark,
  Coins,
} from 'lucide-react';
import { UserProfile, P2POffer, Currency, OfferType } from '../types';
import { db } from '../services/database';
import { CURRENCY_CONFIG, CurrencyBadge, formatMoney, formatExchangeRate } from '../utils/currencyFormat';

interface MarketplacePageProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigate: (tab: string) => void;
  onOpenChat: (participantId: string, requestId?: string, offerId?: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  currentUser,
  onOpenAuth,
  onNavigate,
  onOpenChat,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | OfferType>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | Currency>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rate_asc' | 'rate_desc' | 'recent'>('recent');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedOfferForRequest, setSelectedOfferForRequest] = useState<P2POffer | null>(null);

  // Form states for creating offer
  const [newType, setNewType] = useState<OfferType>('SELL');
  const [newOfferCurr, setNewOfferCurr] = useState<Currency>('EUR');
  const [newReceiveCurr, setNewReceiveCurr] = useState<Currency>('AOA');
  const [newAmount, setNewAmount] = useState<string>('100');
  const [newRate, setNewRate] = useState<string>('989.5');
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('MB WAY / Multicaixa Express');
  const [newCountry, setNewCountry] = useState<string>('Portugal');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTerms, setNewTerms] = useState<string>('Libertação rápida após confirmação');
  const [formError, setFormError] = useState('');

  // Form states for requesting exchange
  const [requestAmount, setRequestAmount] = useState<string>('100');
  const [requestPaymentMethod, setRequestPaymentMethod] = useState<string>('MB WAY');
  const [requestFeedback, setRequestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const offers = db.getOffers();

  // Filter and sort offers
  const filteredOffers = useMemo(() => {
    return offers
      .filter((offer) => {
        if (offer.status !== 'ATIVA') return false;
        if (filterType !== 'ALL' && offer.type !== filterType) return false;
        if (selectedCurrency !== 'ALL' && offer.offerCurrency !== selectedCurrency && offer.receiveCurrency !== selectedCurrency) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            offer.userName.toLowerCase().includes(q) ||
            offer.paymentMethod.toLowerCase().includes(q) ||
            offer.country.toLowerCase().includes(q) ||
            offer.offerCurrency.toLowerCase().includes(q) ||
            offer.receiveCurrency.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rate_asc') return a.proposedRate - b.proposedRate;
        if (sortBy === 'rate_desc') return b.proposedRate - a.proposedRate;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [offers, filterType, selectedCurrency, searchQuery, sortBy]);

  const eligibility = currentUser ? db.canPerformP2POperations(currentUser.id) : { allowed: false, reason: 'Inicie sessão' };

  const handleOpenCreateModal = () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (!eligibility.allowed) {
      setFormError(eligibility.reason || 'Necessita de conta Premium e KYC aprovado.');
      setCreateModalOpen(true);
      return;
    }
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amt = parseFloat(newAmount);
    const rt = parseFloat(newRate);

    if (isNaN(amt) || amt <= 0) {
      setFormError('Introduza uma quantidade válida.');
      return;
    }

    if (isNaN(rt) || rt <= 0) {
      setFormError('Introduza uma taxa de câmbio válida.');
      return;
    }

    if (newOfferCurr === newReceiveCurr) {
      setFormError('A moeda que oferece não pode ser igual à que pretende receber.');
      return;
    }

    const res = db.createOffer(currentUser.id, {
      type: newType,
      offerCurrency: newOfferCurr,
      receiveCurrency: newReceiveCurr,
      availableAmount: amt,
      minAmount: 10,
      proposedRate: rt,
      paymentMethod: newPaymentMethod,
      country: newCountry,
      description: newDescription,
      terms: newTerms,
    });

    if (res.success) {
      setCreateModalOpen(false);
      setFormError('');
    } else {
      setFormError(res.message || 'Erro ao publicar oferta.');
    }
  };

  const handleOpenRequest = (offer: P2POffer) => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    setSelectedOfferForRequest(offer);
    setRequestAmount(String(Math.min(100, offer.availableAmount)));
    setRequestFeedback(null);
    setRequestModalOpen(true);
  };

  const handleSubmitExchangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedOfferForRequest) return;

    const amt = parseFloat(requestAmount);
    if (isNaN(amt) || amt <= 0 || amt > selectedOfferForRequest.availableAmount) {
      setRequestFeedback({
        type: 'error',
        message: `Quantidade inválida. Deve ser entre 10 e ${selectedOfferForRequest.availableAmount} ${selectedOfferForRequest.offerCurrency}`,
      });
      return;
    }

    const res = db.createExchangeRequest(
      currentUser.id,
      selectedOfferForRequest.id,
      amt,
      requestPaymentMethod
    );

    if (res.success && res.request) {
      setRequestFeedback({
        type: 'success',
        message: 'Solicitação criada com sucesso! O Super Admin foi alertado sonoramente e irá mediar a operação.',
      });
      setTimeout(() => {
        setRequestModalOpen(false);
        onNavigate('requests');
      }, 1500);
    } else {
      setRequestFeedback({ type: 'error', message: res.message || 'Falha ao criar solicitação.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mercado P2P de Moedas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Negociação direta de EUR (Euro) e AOA (Kwanza) com outros utilizadores verificados.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Oferta</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#101D35] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por utilizador, método (ex: MB WAY, Express) ou país..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
            />
          </div>

          {/* Currency Filter */}
          <div>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as 'ALL' | Currency)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
            >
              <option value="ALL">Todas as Moedas</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="AOA">AOA (Kwanza)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rate_asc' | 'rate_desc' | 'recent')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
            >
              <option value="recent">Mais Recentes</option>
              <option value="rate_asc">Menor Taxa</option>
              <option value="rate_desc">Maior Taxa</option>
            </select>
          </div>
        </div>

        {/* Operation Type Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-[#246BFD] text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas ({offers.filter((o) => o.status === 'ATIVA').length})
          </button>
          <button
            onClick={() => setFilterType('SELL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'SELL'
                ? 'bg-[#246BFD] text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Venda (Utilizadores a Vender)
          </button>
          <button
            onClick={() => setFilterType('BUY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'BUY'
                ? 'bg-[#246BFD] text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Compra (Utilizadores a Comprar)
          </button>
        </div>
      </div>

      {/* Offers Listings */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma oferta encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem ofertas ativas que correspondam aos filtros selecionados. Seja o primeiro a publicar uma nova oferta no mercado!
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#246BFD] text-white text-xs font-semibold rounded-xl"
          >
            Publicar Anúncio Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const isOwner = currentUser?.id === offer.userId;
            const estimatedReceive = offer.availableAmount * offer.proposedRate;
            return (
              <div
                key={offer.id}
                className="bg-white dark:bg-[#0c162c] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Header do cartão bancário */}
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                        {offer.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{offer.userName}</span>
                          <span title="Operador Verificado com Conta Premium">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{offer.country}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CurrencyBadge currency={offer.offerCurrency} size="sm" />
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          offer.type === 'SELL'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {offer.type === 'SELL' ? 'Venda' : 'Compra'}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Montantes e Taxas com Símbolos Oficiais */}
                  <div className="pt-3.5 space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-medium">Montante Disponível:</span>
                        <span className="text-[10px] font-mono uppercase text-slate-400">Total</span>
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatMoney(offer.availableAmount, offer.offerCurrency)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between border-t border-slate-200/40 dark:border-slate-800 pt-1.5">
                        <span>Recebimento total:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(estimatedReceive, offer.receiveCurrency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-medium">Câmbio Acordado:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatExchangeRate(offer.proposedRate, offer.offerCurrency, offer.receiveCurrency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Canal de Liquidação:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {offer.paymentMethod}
                      </span>
                    </div>

                    {offer.terms && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg line-clamp-2 italic">
                        "{offer.terms}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé do Cartão */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(offer.createdAt).toLocaleDateString('pt-PT')}
                  </span>

                  {isOwner ? (
                    <span className="text-xs text-slate-400 italic font-semibold">O seu anúncio</span>
                  ) : (
                    <button
                      onClick={() => handleOpenRequest(offer)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Solicitar Câmbio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Publicar Anúncio no Mercado P2P
                </h3>
                <p className="text-xs text-slate-500">Exclusivo para membros Premium com KYC verificado.</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {!eligibility.allowed ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Funcionalidade Bloqueada
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    {eligibility.reason}
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      onClick={() => {
                        setCreateModalOpen(false);
                        onNavigate('premium');
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                    >
                      Ativar Premium (20 € MB WAY)
                    </button>
                    <button
                      onClick={() => {
                        setCreateModalOpen(false);
                        onNavigate('kyc');
                      }}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl"
                    >
                      Submeter KYC
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateOffer} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 rounded-xl text-xs font-semibold">
                      {formError}
                    </div>
                  )}

                  {/* Operation Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tipo de Anúncio
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewType('SELL')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          newType === 'SELL'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Quero Vender Moeda
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewType('BUY')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          newType === 'BUY'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Quero Comprar Moeda
                      </button>
                    </div>
                  </div>

                  {/* Currencies */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Moeda que Oferece
                      </label>
                      <select
                        value={newOfferCurr}
                        onChange={(e) => setNewOfferCurr(e.target.value as Currency)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="EUR">EUR (Euro)</option>
                        <option value="AOA">AOA (Kwanza)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Moeda que Pretende Receber
                      </label>
                      <select
                        value={newReceiveCurr}
                        onChange={(e) => setNewReceiveCurr(e.target.value as Currency)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="AOA">AOA (Kwanza)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                  </div>

                  {/* Amounts & Rates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quantidade Disponível
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="Ex: 500"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Taxa Proposta (1 {newOfferCurr} =)
                      </label>
                      <input
                        type="number"
                        min="0.000001"
                        step="any"
                        required
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        placeholder="Ex: 0.925 ou 915"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Payment Method & Country */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Método de Pagamento
                      </label>
                      <input
                        type="text"
                        required
                        value={newPaymentMethod}
                        onChange={(e) => setNewPaymentMethod(e.target.value)}
                        placeholder="Ex: MB WAY / Transferência"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        País de Operação
                      </label>
                      <input
                        type="text"
                        required
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        placeholder="Ex: Portugal ou Angola"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Termos & Condições da sua Negociação
                    </label>
                    <textarea
                      rows={2}
                      value={newTerms}
                      onChange={(e) => setNewTerms(e.target.value)}
                      placeholder="Ex: Disponibilidade imediata por MB WAY. Libertação confirmada logo após receção."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                  >
                    Publicar Anúncio no Mercado P2P
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REQUEST EXCHANGE MODAL */}
      {requestModalOpen && selectedOfferForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Solicitar Câmbio P2P
                </h3>
                <p className="text-xs text-slate-500">
                  Com {selectedOfferForRequest.userName} ({selectedOfferForRequest.offerCurrency} /{' '}
                  {selectedOfferForRequest.receiveCurrency})
                </p>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmitExchangeRequest} className="space-y-4">
                {requestFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      requestFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200'
                    }`}
                  >
                    {requestFeedback.message}
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Câmbio Aplicado:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatExchangeRate(
                        selectedOfferForRequest.proposedRate,
                        selectedOfferForRequest.offerCurrency,
                        selectedOfferForRequest.receiveCurrency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Disponível no Anúncio:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {formatMoney(selectedOfferForRequest.availableAmount, selectedOfferForRequest.offerCurrency)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantia a Solicitar ({CURRENCY_CONFIG[selectedOfferForRequest.offerCurrency]?.symbol}{' '}
                    {selectedOfferForRequest.offerCurrency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedOfferForRequest.availableAmount}
                    step="any"
                    required
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold"
                  />
                </div>

                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Valor Estimado a Transferir:</span>
                  <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400">
                    {formatMoney(
                      (parseFloat(requestAmount) || 0) * selectedOfferForRequest.proposedRate,
                      selectedOfferForRequest.receiveCurrency
                    )}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Método de Pagamento Preferido
                  </label>
                  <input
                    type="text"
                    required
                    value={requestPaymentMethod}
                    onChange={(e) => setRequestPaymentMethod(e.target.value)}
                    placeholder="Ex: MB WAY ou Transferência Bancária"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ao submeter, o Super Admin receberá um alerta sonoro contínuo no sistema e intermediará a conversa entre as partes.
                </p>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Confirmar e Solicitar Câmbio
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
