/**
 * Quick Send — Type Definitions
 * P2P Currency Exchange Marketplace (EUR, AOA)
 */

export type Currency = 'EUR' | 'AOA';

export type UserRole = 'SUPER_ADMIN' | 'USER';

export interface UserPaymentMethods {
  // Portugal / Euro
  ibanEur?: string; // IBAN PT (ex: PT50 0000 0000 0000 0000 0000 0)
  mbwayPhone?: string; // MB WAY Telefone Portugal (ex: +351 912 345 678)
  
  // Angola / Kwanza
  ibanAoa?: string; // IBAN Angola (ex: AO06 0000 0000 0000 0000 0000 0)
  expressPhone?: string; // Multicaixa Express Telefone Angola (ex: +244 923 456 789)
}

export type KYCStatus =
  | 'NAO_SUBMETIDO'
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'DOCS_ADICIONAIS'
  | 'EXPIRADO';

export type KYCDocumentType =
  | 'BILHETE_IDENTIDADE'
  | 'CARTAO_CIDADAO'
  | 'PASSAPORTE'
  | 'COMPROVATIVO_MORADA'
  | 'SELFIE';

export type PremiumStatus =
  | 'NAO_PAGO'
  | 'PENDENTE'
  | 'EM_VERIFICACAO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'EXPIRADO';

export type OfferType = 'BUY' | 'SELL';

export type ExchangeRequestStatus =
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EM_NEGOCIACAO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGAMENTO_EM_VERIFICACAO'
  | 'RECEBIMENTO_CONFIRMADO'
  | 'EM_DISPUTA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type ReportStatus = 'NOVA' | 'EM_ANALISE' | 'RESOLVIDA' | 'REJEITADA' | 'ENCERRADA';

export type ReportSeverity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  isBlocked: boolean;
  isSuspended: boolean;
  suspendReason?: string;
  paymentMethods: UserPaymentMethods;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface ExchangeRate {
  id: string;
  baseCurrency: Currency;
  targetCurrency: Currency;
  pair: string; // e.g. "EUR/AOA", "AOA/EUR"
  referenceRate: number;
  buyRate: number;
  sellRate: number;
  marginPercent: number;
  commissionPercent: number;
  isActive: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface RateHistoryItem {
  id: string;
  pair: string;
  oldReferenceRate: number;
  newReferenceRate: number;
  oldBuyRate: number;
  newBuyRate: number;
  oldSellRate: number;
  newSellRate: number;
  updatedBy: string;
  timestamp: string;
}

export interface PremiumSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: PremiumStatus;
  amount: number; // 20.00
  currency: string; // "EUR"
  mbwayNumber: string; // "936924849"
  paymentReference: string;
  senderPhone?: string;
  proofDataUrl?: string; // base64 or storage url
  proofFileName?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  startDate?: string;
  expiresDate?: string;
  rejectionReason?: string;
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: KYCDocumentType;
  documentNumber?: string;
  frontDataUrl?: string;
  backDataUrl?: string;
  selfieDataUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: KYCStatus;
  rejectionReason?: string;
}

export interface P2POffer {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  isPremium: boolean;
  type: OfferType; // BUY (Quero comprar) or SELL (Quero vender)
  offerCurrency: Currency; // Moeda que oferece
  receiveCurrency: Currency; // Moeda que pretende receber
  availableAmount: number;
  minAmount: number;
  proposedRate: number;
  paymentMethod: string; // e.g. "MB WAY", "Transferência Bancária", "Em Mão", "BAI Direto", etc.
  country: string; // "Portugal", "Angola", "União Europeia", etc.
  description: string;
  terms: string;
  status: 'ATIVA' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA' | 'SUSPENSA_MODERACAO';
  createdAt: string;
}

export interface ExchangeRequest {
  id: string;
  offerId?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  offerCurrency: Currency;
  receiveCurrency: Currency;
  amount: number;
  agreedRate: number;
  estimatedValue: number;
  paymentMethod: string;
  receiverPaymentDetails?: {
    methodType: 'IBAN_EUR' | 'MBWAY_PT' | 'IBAN_AOA' | 'EXPRESS_AO';
    label: string;
    value: string;
  };
  status: ExchangeRequestStatus;
  receiverConfirmed: boolean; // Confirmação de que o receptor recebeu
  senderConfirmed: boolean;
  adminApproved: boolean;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  needsAdminAttention: boolean; // Triggers continuous audio alarm for Super Admin!
  statusHistory: {
    status: ExchangeRequestStatus;
    timestamp: string;
    note?: string;
    changedBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachmentUrl?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  requestId?: string;
  offerId?: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadCount: Record<string, number>;
  isBlocked: boolean;
  blockedBy?: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string;
  targetUserName: string;
  offerId?: string;
  requestId?: string;
  reason: string;
  details: string;
  severity: ReportSeverity;
  status: ReportStatus;
  adminResolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  performedByEmail: string;
  category: 'AUTH' | 'RATES' | 'PREMIUM' | 'KYC' | 'EXCHANGE' | 'MODERATION' | 'SYSTEM';
  timestamp: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'PAYMENT' | 'KYC' | 'EXCHANGE' | 'CHAT' | 'SECURITY' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  actionLink?: string;
}

export interface PlatformConfig {
  mbwayNumber: string; // "936924849"
  monthlyFee: number; // 20.00
  feeCurrency: string; // "EUR"
  supabaseUrl: string;
  supabaseAnonKey: string;
  soundAlarmEnabled: boolean;
  alarmVolume: number; // 0 to 1
}
