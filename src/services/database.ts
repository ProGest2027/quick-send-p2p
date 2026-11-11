/**
 * Quick Send — Unified Database & Business Rules Engine
 * Implements persistent storage, atomic First-User-SUPER_ADMIN assignment,
 * KYC processing, MB WAY subscriptions (936924849), P2P marketplace,
 * exchange requests, chat, audit logs, and Super Admin continuous sound alarm dispatch.
 */

import {
  UserProfile,
  UserRole,
  UserPaymentMethods,
  ExchangeRate,
  RateHistoryItem,
  PremiumSubscription,
  KYCDocument,
  P2POffer,
  ExchangeRequest,
  Conversation,
  ChatMessage,
  ReportItem,
  AuditLogItem,
  InAppNotification,
  PlatformConfig,
  ExchangeRequestStatus,
  KYCStatus,
  PremiumStatus,
  Currency,
} from '../types';
import { soundAlarmService } from './soundAlarm';

const STORAGE_KEYS = {
  USERS: 'quicksend_users_v2',
  SESSION: 'quicksend_active_session_v2',
  RATES: 'quicksend_exchange_rates_v2',
  RATE_HISTORY: 'quicksend_rate_history_v2',
  SUBSCRIPTIONS: 'quicksend_subscriptions_v2',
  KYC: 'quicksend_kyc_v2',
  OFFERS: 'quicksend_offers_v2',
  REQUESTS: 'quicksend_exchange_requests_v2',
  CONVERSATIONS: 'quicksend_conversations_v2',
  MESSAGES: 'quicksend_messages_v2',
  REPORTS: 'quicksend_reports_v2',
  AUDIT: 'quicksend_audit_logs_v2',
  NOTIFICATIONS: 'quicksend_notifications_v2',
  CONFIG: 'quicksend_platform_config_v2',
};

// Initial Rates — EUR and AOA
const DEFAULT_RATES: ExchangeRate[] = [
  {
    id: 'rate-1',
    baseCurrency: 'EUR',
    targetCurrency: 'AOA',
    pair: 'EUR/AOA',
    referenceRate: 989.5,
    buyRate: 978.0,
    sellRate: 1001.0,
    marginPercent: 2.0,
    commissionPercent: 0.5,
    isActive: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'SYSTEM',
  },
  {
    id: 'rate-2',
    baseCurrency: 'AOA',
    targetCurrency: 'EUR',
    pair: 'AOA/EUR',
    referenceRate: 0.00101,
    buyRate: 0.00099,
    sellRate: 0.00102,
    marginPercent: 2.0,
    commissionPercent: 0.5,
    isActive: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'SYSTEM',
  },
];

const DEFAULT_CONFIG: PlatformConfig = {
  mbwayNumber: '936924849',
  monthlyFee: 20.0,
  feeCurrency: 'EUR',
  supabaseUrl: '',
  supabaseAnonKey: '',
  soundAlarmEnabled: true,
  alarmVolume: 0.6,
};

type StateChangeListener = () => void;

class DatabaseEngine {
  private listeners: Set<StateChangeListener> = new Set();
  private alarmCheckInterval: number | null = null;

  constructor() {
    this.ensureInitialData();
    this.startPeriodicAlarmCheck();
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
    this.checkSuperAdminAlarm();
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  private ensureInitialData() {
    if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
      this.set(STORAGE_KEYS.RATES, DEFAULT_RATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
      this.set(STORAGE_KEYS.AUDIT, [
        {
          id: 'audit-init',
          action: 'SISTEMA_INICIALIZADO',
          details: 'Plataforma Quick Send inicializada com sucesso. Primeiro cadastro será SUPER_ADMIN.',
          performedBy: 'SYSTEM',
          performedByEmail: 'system@quicksend.io',
          category: 'SYSTEM',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }

  // ========================================================
  // 1. AUTH & ATOMIC FIRST-USER SUPER ADMIN RULE
  // ========================================================

  public getUsers(): UserProfile[] {
    const raw = this.get<UserProfile[]>(STORAGE_KEYS.USERS, []);
    return raw.map((u) => ({
      ...u,
      paymentMethods: u.paymentMethods || {},
    }));
  }

  public hasSuperAdmin(): boolean {
    const users = this.getUsers();
    return users.some((u) => u.role === 'SUPER_ADMIN');
  }

  public getCurrentSession(): UserProfile | null {
    const session = this.get<UserProfile | null>(STORAGE_KEYS.SESSION, null);
    if (!session) return null;
    // Always refresh with latest user data (role, suspensions, payment methods, etc.)
    const user = this.getUsers().find((u) => u.id === session.id);
    return user || session;
  }

  public setActiveSession(user: UserProfile) {
    const users = this.getUsers();
    const existingIndex = users.findIndex(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.SESSION, user);
    this.notify();
  }

  /**
   * Atomic Registration:
   * Rule 5 of Master Prompt + Reception payment methods:
   * (IBAN PT/EUR, MB WAY Telefone PT, IBAN AO/Kz, Multicaixa Express AO)
   */
  public registerUser(
    fullName: string,
    email: string,
    phone: string,
    passwordHash: string,
    paymentMethods?: UserPaymentMethods,
    forcedId?: string,
    forcedRole?: UserRole
  ): { success: boolean; user?: UserProfile; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Já existe uma conta registada com este email.' };
    }

    // Atomic assignment check: if no SUPER_ADMIN exists yet, this user is SUPER_ADMIN
    const isFirstUser = forcedRole ? forcedRole === 'SUPER_ADMIN' : !this.hasSuperAdmin();
    const assignedRole = forcedRole || (isFirstUser ? 'SUPER_ADMIN' : 'USER');

    const newUser: UserProfile = {
      id: forcedId || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      fullName: fullName.trim(),
      phoneNumber: phone.trim(),
      role: assignedRole,
      isBlocked: false,
      isSuspended: false,
      paymentMethods: paymentMethods || {},
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Store user securely with password hash
    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);

    // Save password credentials privately in storage (in Supabase, handled by auth.users)
    const creds = this.get<Record<string, string>>('quicksend_creds_v2', {});
    creds[cleanEmail] = passwordHash;
    this.set('quicksend_creds_v2', creds);

    // Set active session
    this.set(STORAGE_KEYS.SESSION, newUser);

    // Create Audit Log
    this.logAudit(
      'REGISTO_UTILIZADOR',
      `Utilizador ${newUser.fullName} (${newUser.email}) registado. Atribuída função: ${assignedRole}${
        isFirstUser ? ' [REGRA ESPECIAL: PRIMEIRO CADASTRO SUPER ADMIN]' : ''
      }. Métodos de receção registados.`,
      newUser.id,
      newUser.email,
      'AUTH'
    );

    // Add welcome notification
    this.addNotification(
      newUser.id,
      'Bem-vindo ao QUICK SEND!',
      isFirstUser
        ? 'A sua conta é o primeiro registo da plataforma e foi configurada como SUPER_ADMIN com acesso total ao painel de gestão.'
        : 'A sua conta foi criada com sucesso. Os seus métodos de receção de valores (IBAN / MB WAY / Express) estão configurados.',
      'SYSTEM'
    );

    this.notify();
    return { success: true, user: newUser };
  }

  public updateUserPaymentMethods(userId: string, paymentMethods: UserPaymentMethods): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    user.paymentMethods = {
      ...user.paymentMethods,
      ...paymentMethods,
    };

    this.set(STORAGE_KEYS.USERS, users);

    // Update session if it's the current user
    const session = this.getCurrentSession();
    if (session && session.id === userId) {
      session.paymentMethods = user.paymentMethods;
      this.set(STORAGE_KEYS.SESSION, session);
    }

    this.logAudit(
      'METODOS_PAGAMENTO_ATUALIZADOS',
      `Métodos de receção de valores atualizados para ${user.fullName} (${user.email})`,
      userId,
      user.email,
      'SYSTEM'
    );

    this.notify();
    return true;
  }

  public loginUser(email: string, passwordHash: string): { success: boolean; user?: UserProfile; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Conta não encontrada com este email.' };
    }

    if (user.isBlocked) {
      return { success: false, message: `Esta conta está bloqueada pelo administrador. Motivo: ${user.suspendReason || 'Violação dos termos'}` };
    }

    const creds = this.get<Record<string, string>>('quicksend_creds_v2', {});
    const storedHash = creds[cleanEmail];

    // Check password if stored
    if (storedHash && storedHash !== passwordHash) {
      return { success: false, message: 'Palavra-passe incorreta.' };
    }

    user.lastLoginAt = new Date().toISOString();
    this.set(STORAGE_KEYS.USERS, users);
    this.set(STORAGE_KEYS.SESSION, user);

    this.logAudit(
      'LOGIN_UTILIZADOR',
      `Sessão iniciada por ${user.fullName} (${user.role})`,
      user.id,
      user.email,
      'AUTH'
    );

    this.notify();
    return { success: true, user };
  }

  public logout() {
    const current = this.getCurrentSession();
    if (current) {
      this.logAudit(
        'LOGOUT_UTILIZADOR',
        `Sessão encerrada por ${current.fullName}`,
        current.id,
        current.email,
        'AUTH'
      );
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    this.notify();
  }

  public updateUserStatus(
    userId: string,
    action: 'BLOCK' | 'UNBLOCK' | 'SUSPEND' | 'UNSUSPEND',
    reason: string,
    adminId: string
  ): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;

    // Protection: Cannot block a Super Admin
    if (user.role === 'SUPER_ADMIN') return false;

    if (action === 'BLOCK') {
      user.isBlocked = true;
      user.suspendReason = reason;
    } else if (action === 'UNBLOCK') {
      user.isBlocked = false;
      user.suspendReason = undefined;
    } else if (action === 'SUSPEND') {
      user.isSuspended = true;
      user.suspendReason = reason;
    } else if (action === 'UNSUSPEND') {
      user.isSuspended = false;
      user.suspendReason = undefined;
    }

    this.set(STORAGE_KEYS.USERS, users);
    this.logAudit(
      `CONTA_${action}`,
      `Estado da conta de ${user.fullName} alterado para ${action}. Motivo: ${reason}`,
      adminId,
      user.email,
      'MODERATION'
    );

    this.addNotification(
      user.id,
      `Estado da sua conta atualizado`,
      `A sua conta foi ${action === 'BLOCK' ? 'bloqueada' : action === 'UNBLOCK' ? 'desbloqueada' : action === 'SUSPEND' ? 'suspensa' : 'reativada'}. Motivo: ${reason}`,
      'SECURITY'
    );

    this.notify();
    return true;
  }

  // ========================================================
  // 2. EXCHANGE RATES MANAGEMENT
  // ========================================================

  public getRates(): ExchangeRate[] {
    return this.get<ExchangeRate[]>(STORAGE_KEYS.RATES, DEFAULT_RATES);
  }

  public getRateByPair(pair: string): ExchangeRate | undefined {
    return this.getRates().find((r) => r.pair === pair);
  }

  public updateRate(
    rateId: string,
    newRef: number,
    newBuy: number,
    newSell: number,
    adminId: string,
    adminEmail: string
  ): boolean {
    const rates = this.getRates();
    const rate = rates.find((r) => r.id === rateId);
    if (!rate) return false;

    const history = this.get<RateHistoryItem[]>(STORAGE_KEYS.RATE_HISTORY, []);
    history.unshift({
      id: 'rh_' + Date.now(),
      pair: rate.pair,
      oldReferenceRate: rate.referenceRate,
      newReferenceRate: newRef,
      oldBuyRate: rate.buyRate,
      newBuyRate: newBuy,
      oldSellRate: rate.sellRate,
      newSellRate: newSell,
      updatedBy: adminEmail,
      timestamp: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.RATE_HISTORY, history);

    rate.referenceRate = newRef;
    rate.buyRate = newBuy;
    rate.sellRate = newSell;
    rate.lastUpdated = new Date().toISOString();
    rate.updatedBy = adminId;

    this.set(STORAGE_KEYS.RATES, rates);

    this.logAudit(
      'TAXA_ATUALIZADA',
      `Taxa do par ${rate.pair} atualizada. Ref: ${newRef}, Compra: ${newBuy}, Venda: ${newSell}`,
      adminId,
      adminEmail,
      'RATES'
    );

    this.notify();
    return true;
  }

  public getRateHistory(): RateHistoryItem[] {
    return this.get<RateHistoryItem[]>(STORAGE_KEYS.RATE_HISTORY, []);
  }

  // ========================================================
  // 3. PREMIUM MEMBERSHIP (MB WAY: 936924849, 20€/MÊS)
  // ========================================================

  public getSubscriptions(): PremiumSubscription[] {
    return this.get<PremiumSubscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
  }

  public getUserSubscription(userId: string): PremiumSubscription | undefined {
    return this.getSubscriptions().find((s) => s.userId === userId);
  }

  public isUserPremium(userId: string): boolean {
    const sub = this.getUserSubscription(userId);
    if (!sub || sub.status !== 'APROVADO') return false;
    if (!sub.expiresDate) return false;
    return new Date(sub.expiresDate) > new Date();
  }

  public submitPremiumPayment(
    userId: string,
    paymentReference: string,
    senderPhone?: string,
    proofDataUrl?: string,
    proofFileName?: string
  ): { success: boolean; subscription?: PremiumSubscription; message?: string } {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return { success: false, message: 'Utilizador não encontrado.' };

    const subs = this.getSubscriptions();
    let sub = subs.find((s) => s.userId === userId);

    if (!sub) {
      sub = {
        id: 'sub_' + Date.now(),
        userId,
        userEmail: user.email,
        userName: user.fullName,
        status: 'PENDENTE',
        amount: 20.0,
        currency: 'EUR',
        mbwayNumber: '936924849',
        paymentReference,
        senderPhone,
        proofDataUrl,
        proofFileName,
        submittedAt: new Date().toISOString(),
      };
      subs.push(sub);
    } else {
      sub.status = 'PENDENTE';
      sub.paymentReference = paymentReference;
      sub.senderPhone = senderPhone;
      sub.proofDataUrl = proofDataUrl;
      sub.proofFileName = proofFileName;
      sub.submittedAt = new Date().toISOString();
      sub.rejectionReason = undefined;
    }

    this.set(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    this.logAudit(
      'PAGAMENTO_PREMIUM_SUBMETIDO',
      `Comprovativo MB WAY de 20€ submetido por ${user.fullName} (${user.email}). Ref: ${paymentReference}`,
      userId,
      user.email,
      'PREMIUM'
    );

    this.addNotification(
      userId,
      'Comprovativo MB WAY Recebido',
      'O seu comprovativo de 20,00 € foi enviado para análise manual do Super Admin. Receberá uma notificação assim que for verificado.',
      'PAYMENT'
    );

    this.notify();
    return { success: true, subscription: sub };
  }

  public reviewPremiumPayment(
    subId: string,
    action: 'APPROVE' | 'REJECT',
    adminId: string,
    adminEmail: string,
    rejectionReason?: string
  ): boolean {
    const subs = this.getSubscriptions();
    const sub = subs.find((s) => s.id === subId);
    if (!sub) return false;

    const now = new Date();
    sub.reviewedAt = now.toISOString();
    sub.reviewedBy = adminId;

    if (action === 'APPROVE') {
      sub.status = 'APROVADO';
      sub.startDate = now.toISOString();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      sub.expiresDate = expires.toISOString();

      this.logAudit(
        'PREMIUM_APROVADO',
        `Assinatura Premium aprovada para ${sub.userName} (${sub.userEmail}) por 30 dias até ${expires.toLocaleDateString('pt-PT')}`,
        adminId,
        adminEmail,
        'PREMIUM'
      );

      this.addNotification(
        sub.userId,
        'Assinatura Premium Ativada! 🎉',
        `O seu pagamento MB WAY de 20 € foi validado. O seu plano Premium está ativo até ${expires.toLocaleDateString('pt-PT')}.`,
        'PAYMENT'
      );
    } else {
      sub.status = 'REJEITADO';
      sub.rejectionReason = rejectionReason || 'Comprovativo não reconhecido ou valor divergente.';

      this.logAudit(
        'PREMIUM_REJEITADO',
        `Assinatura Premium rejeitada para ${sub.userName}. Motivo: ${sub.rejectionReason}`,
        adminId,
        adminEmail,
        'PREMIUM'
      );

      this.addNotification(
        sub.userId,
        'Pagamento Premium Recusado',
        `O seu comprovativo MB WAY foi recusado. Motivo: ${sub.rejectionReason}. Por favor verifique e submeta novamente.`,
        'PAYMENT'
      );
    }

    this.set(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    this.notify();
    return true;
  }

  // ========================================================
  // 4. KYC VERIFICATION
  // ========================================================

  public getKycSubmissions(): KYCDocument[] {
    return this.get<KYCDocument[]>(STORAGE_KEYS.KYC, []);
  }

  public getUserKyc(userId: string): KYCDocument | undefined {
    return this.getKycSubmissions().find((k) => k.userId === userId);
  }

  public isUserKycApproved(userId: string): boolean {
    const kyc = this.getUserKyc(userId);
    return kyc?.status === 'APROVADO';
  }

  public submitKyc(
    userId: string,
    documentType: KYCDocument['documentType'],
    documentNumber: string,
    frontDataUrl?: string,
    backDataUrl?: string,
    selfieDataUrl?: string
  ): { success: boolean; kyc?: KYCDocument; message?: string } {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return { success: false, message: 'Utilizador não encontrado.' };

    const kycs = this.getKycSubmissions();
    let kyc = kycs.find((k) => k.userId === userId);

    if (!kyc) {
      kyc = {
        id: 'kyc_' + Date.now(),
        userId,
        documentType,
        documentNumber,
        frontDataUrl,
        backDataUrl,
        selfieDataUrl,
        submittedAt: new Date().toISOString(),
        status: 'PENDENTE',
      };
      kycs.push(kyc);
    } else {
      kyc.documentType = documentType;
      kyc.documentNumber = documentNumber;
      kyc.frontDataUrl = frontDataUrl || kyc.frontDataUrl;
      kyc.backDataUrl = backDataUrl || kyc.backDataUrl;
      kyc.selfieDataUrl = selfieDataUrl || kyc.selfieDataUrl;
      kyc.status = 'PENDENTE';
      kyc.submittedAt = new Date().toISOString();
      kyc.rejectionReason = undefined;
    }

    this.set(STORAGE_KEYS.KYC, kycs);

    this.logAudit(
      'KYC_SUBMETIDO',
      `Documento (${documentType}) submetido por ${user.fullName} (${user.email}) para validação de identidade`,
      userId,
      user.email,
      'KYC'
    );

    this.addNotification(
      userId,
      'Documentos KYC em Análise',
      'A sua documentação de identidade foi enviada ao Super Admin e está a ser analisada com a máxima segurança.',
      'KYC'
    );

    this.notify();
    return { success: true, kyc };
  }

  public reviewKyc(
    kycId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_MORE',
    adminId: string,
    adminEmail: string,
    reason?: string
  ): boolean {
    const kycs = this.getKycSubmissions();
    const kyc = kycs.find((k) => k.id === kycId);
    if (!kyc) return false;

    kyc.reviewedAt = new Date().toISOString();
    kyc.reviewedBy = adminId;

    if (action === 'APPROVE') {
      kyc.status = 'APROVADO';
      this.addNotification(
        kyc.userId,
        'Identidade Verificada (KYC Aprovado) 🛡️',
        'A sua verificação de identidade foi aprovada com sucesso! Já cumpre os requisitos de conformidade para operações P2P.',
        'KYC'
      );
    } else if (action === 'REJECT') {
      kyc.status = 'REJEITADO';
      kyc.rejectionReason = reason || 'Documento ilegível ou inválido.';
      this.addNotification(
        kyc.userId,
        'Verificação KYC Recusada',
        `O seu documento foi recusado. Motivo: ${kyc.rejectionReason}. Por favor envie uma cópia nítida.`,
        'KYC'
      );
    } else {
      kyc.status = 'DOCS_ADICIONAIS';
      kyc.rejectionReason = reason || 'Necessário documento complementar de morada ou selfie mais nítida.';
      this.addNotification(
        kyc.userId,
        'Documentação Adicional Solicitada',
        `O analista solicitou documentos complementares: ${kyc.rejectionReason}`,
        'KYC'
      );
    }

    this.set(STORAGE_KEYS.KYC, kycs);
    this.logAudit(
      `KYC_${action}`,
      `KYC do utilizador ${kyc.userId} atualizado para ${kyc.status}. Justificação: ${reason || 'N/A'}`,
      adminId,
      adminEmail,
      'KYC'
    );

    this.notify();
    return true;
  }

  // Central Eligibility Validation: Rule 18 of Prompt Master
  public canPerformP2POperations(userId: string): { allowed: boolean; reason?: string } {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return { allowed: false, reason: 'Utilizador não encontrado.' };
    if (user.isBlocked) return { allowed: false, reason: 'A sua conta está bloqueada pela moderação.' };
    if (user.isSuspended) return { allowed: false, reason: 'A sua conta está temporariamente suspensa.' };

    // Super Admin has unrestricted permissions
    if (user.role === 'SUPER_ADMIN') return { allowed: true };

    const isPremium = this.isUserPremium(userId);
    const isKyc = this.isUserKycApproved(userId);

    if (!isPremium && !isKyc) {
      return { allowed: false, reason: 'Necessita de ativar a assinatura Premium (20 €/mês) e ter o KYC aprovado.' };
    }
    if (!isPremium) {
      return { allowed: false, reason: 'Necessita de assinatura Premium ativa (20 €/mês por MB WAY).' };
    }
    if (!isKyc) {
      return { allowed: false, reason: 'A sua verificação de identidade (KYC) ainda não foi aprovada.' };
    }

    return { allowed: true };
  }

  // ========================================================
  // 5. P2P MARKETPLACE OFFERS
  // ========================================================

  public getOffers(): P2POffer[] {
    return this.get<P2POffer[]>(STORAGE_KEYS.OFFERS, []);
  }

  public createOffer(
    userId: string,
    offerData: Omit<P2POffer, 'id' | 'userId' | 'userName' | 'userPhone' | 'userRole' | 'isPremium' | 'createdAt' | 'status'>
  ): { success: boolean; offer?: P2POffer; message?: string } {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return { success: false, message: 'Utilizador não encontrado.' };

    // Strict Rule: Only Premium + KYC approved users can publish offers
    const eligibility = this.canPerformP2POperations(userId);
    if (!eligibility.allowed) {
      return { success: false, message: eligibility.reason };
    }

    const offers = this.getOffers();
    const newOffer: P2POffer = {
      id: 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      userRole: user.role,
      isPremium: true,
      status: 'ATIVA',
      createdAt: new Date().toISOString(),
      ...offerData,
    };

    offers.unshift(newOffer);
    this.set(STORAGE_KEYS.OFFERS, offers);

    this.logAudit(
      'OFERTA_CRIADA',
      `Oferta P2P ${newOffer.type} ${newOffer.availableAmount} ${newOffer.offerCurrency} por ${newOffer.receiveCurrency} criada por ${user.fullName}`,
      userId,
      user.email,
      'EXCHANGE'
    );

    this.notify();
    return { success: true, offer: newOffer };
  }

  public updateOfferStatus(offerId: string, status: P2POffer['status'], adminOrUserId: string): boolean {
    const offers = this.getOffers();
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return false;

    offer.status = status;
    this.set(STORAGE_KEYS.OFFERS, offers);
    this.notify();
    return true;
  }

  // ========================================================
  // 6. EXCHANGE REQUESTS (SOLICITAÇÕES DE CÂMBIO)
  // Flow with Admin Continuous Sound Alarm & Receiver Confirmation
  // ========================================================

  public getRequests(): ExchangeRequest[] {
    return this.get<ExchangeRequest[]>(STORAGE_KEYS.REQUESTS, []);
  }

  public createExchangeRequest(
    buyerId: string,
    offerId: string,
    amount: number,
    paymentMethod: string
  ): { success: boolean; request?: ExchangeRequest; message?: string } {
    const buyer = this.getUsers().find((u) => u.id === buyerId);
    if (!buyer) return { success: false, message: 'Comprador não encontrado.' };

    const offer = this.getOffers().find((o) => o.id === offerId);
    if (!offer) return { success: false, message: 'Oferta não encontrada.' };

    if (offer.userId === buyerId) {
      return { success: false, message: 'Não pode solicitar câmbio na sua própria oferta.' };
    }

    if (amount <= 0 || amount > offer.availableAmount) {
      return { success: false, message: `Quantidade inválida. Máximo disponível: ${offer.availableAmount} ${offer.offerCurrency}` };
    }

    const seller = this.getUsers().find((u) => u.id === offer.userId);
    const sellerName = seller?.fullName || offer.userName;
    const sellerPhone = seller?.phoneNumber || offer.userPhone;

    const estimatedValue = Number((amount * offer.proposedRate).toFixed(2));

    // Resolve receiver's payout details based on currency being received
    let receiverPaymentDetails: ExchangeRequest['receiverPaymentDetails'] | undefined = undefined;
    if (offer.receiveCurrency === 'EUR') {
      if (seller?.paymentMethods?.mbwayPhone) {
        receiverPaymentDetails = {
          methodType: 'MBWAY_PT',
          label: 'MB WAY (Portugal)',
          value: seller.paymentMethods.mbwayPhone,
        };
      } else if (seller?.paymentMethods?.ibanEur) {
        receiverPaymentDetails = {
          methodType: 'IBAN_EUR',
          label: 'IBAN Portugal (EUR)',
          value: seller.paymentMethods.ibanEur,
        };
      }
    } else if (offer.receiveCurrency === 'AOA') {
      if (seller?.paymentMethods?.expressPhone) {
        receiverPaymentDetails = {
          methodType: 'EXPRESS_AO',
          label: 'Multicaixa Express (Angola)',
          value: seller.paymentMethods.expressPhone,
        };
      } else if (seller?.paymentMethods?.ibanAoa) {
        receiverPaymentDetails = {
          methodType: 'IBAN_AOA',
          label: 'IBAN Angola (AOA)',
          value: seller.paymentMethods.ibanAoa,
        };
      }
    }

    const requests = this.getRequests();
    const newRequest: ExchangeRequest = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      offerId: offer.id,
      buyerId: buyer.id,
      buyerName: buyer.fullName,
      buyerPhone: buyer.phoneNumber,
      sellerId: offer.userId,
      sellerName,
      sellerPhone,
      offerCurrency: offer.offerCurrency,
      receiveCurrency: offer.receiveCurrency,
      amount,
      agreedRate: offer.proposedRate,
      estimatedValue,
      paymentMethod,
      receiverPaymentDetails,
      status: 'PENDENTE',
      receiverConfirmed: false,
      senderConfirmed: false,
      adminApproved: false,
      needsAdminAttention: true, // Triggers continuous Super Admin audio alarm!
      statusHistory: [
        {
          status: 'PENDENTE',
          timestamp: new Date().toISOString(),
          note: 'Solicitação criada pelo utilizador. Aguarda aprovação e mediação do Super Admin.',
          changedBy: buyer.fullName,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    this.set(STORAGE_KEYS.REQUESTS, requests);

    // Create a private conversation between buyer, seller, and platform
    this.getOrCreateConversation([buyer.id, offer.userId], newRequest.id, offer.id);

    this.logAudit(
      'SOLICITACAO_CAMBIO_CRIADA',
      `Solicitação de ${amount} ${offer.offerCurrency} criada por ${buyer.fullName} para oferta de ${sellerName}`,
      buyer.id,
      buyer.email,
      'EXCHANGE'
    );

    // Notify seller
    this.addNotification(
      offer.userId,
      'Nova Solicitação de Câmbio!',
      `${buyer.fullName} solicitou a troca de ${amount} ${offer.offerCurrency} por ${estimatedValue} ${offer.receiveCurrency}.`,
      'EXCHANGE'
    );

    // Notify buyer
    this.addNotification(
      buyer.id,
      'Solicitação Registada',
      `A sua solicitação de ${amount} ${offer.offerCurrency} foi enviada. O Super Admin foi alertado sonoramente para mediar a transação.`,
      'EXCHANGE'
    );

    this.notify();
    return { success: true, request: newRequest };
  }

  /**
   * Admin approves, updates, or rejects exchange requests
   */
  public updateRequestStatusByAdmin(
    requestId: string,
    newStatus: ExchangeRequestStatus,
    adminId: string,
    adminEmail: string,
    adminNotes?: string
  ): boolean {
    const requests = this.getRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = newStatus;
    req.adminApproved = newStatus === 'APROVADA' || newStatus === 'CONCLUIDA';
    req.adminNotes = adminNotes || req.adminNotes;
    req.reviewedBy = adminId;
    req.reviewedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    // If accepted or resolved by admin, clear the urgent attention alarm
    if (['APROVADA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA'].includes(newStatus)) {
      req.needsAdminAttention = false;
    }

    req.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: adminNotes || `Estado atualizado para ${newStatus} pelo administrador`,
      changedBy: adminEmail,
    });

    this.set(STORAGE_KEYS.REQUESTS, requests);

    this.logAudit(
      'SOLICITACAO_CAMBIO_MODERADA',
      `Solicitação ${req.id} atualizada para ${newStatus} pelo Super Admin. Notas: ${adminNotes || 'N/A'}`,
      adminId,
      adminEmail,
      'EXCHANGE'
    );

    // Notify participants
    this.addNotification(
      req.buyerId,
      `Atualização da Operação: ${newStatus}`,
      `O Super Admin atualizou a sua operação para: ${newStatus}. ${adminNotes ? 'Nota: ' + adminNotes : ''}`,
      'EXCHANGE'
    );
    this.addNotification(
      req.sellerId,
      `Atualização da Operação: ${newStatus}`,
      `O Super Admin atualizou a operação para: ${newStatus}. ${adminNotes ? 'Nota: ' + adminNotes : ''}`,
      'EXCHANGE'
    );

    this.notify();
    return true;
  }

  /**
   * Special Rule: "Quando solicitar ou aceitar uma negociação de cambio, a plataforma só disponibiliza
   * caso o receptor confirmar que recebeu, o admin será notificado sonoramente em forma de alarme
   * continuo até aceitar"
   */
  public confirmReceiptByReceiver(
    requestId: string,
    userId: string
  ): { success: boolean; message: string } {
    const requests = this.getRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Operação não encontrada.' };

    if (req.sellerId !== userId && req.buyerId !== userId) {
      return { success: false, message: 'Apenas os intervenientes podem confirmar receção.' };
    }

    req.receiverConfirmed = true;
    req.status = 'RECEBIMENTO_CONFIRMADO';
    req.needsAdminAttention = true; // Triggers continuous audio alarm for Super Admin!
    req.updatedAt = new Date().toISOString();

    req.statusHistory.push({
      status: 'RECEBIMENTO_CONFIRMADO',
      timestamp: new Date().toISOString(),
      note: 'O receptor confirmou formalmente a receção dos fundos acordados. Aguarda finalização do Super Admin.',
      changedBy: userId === req.sellerId ? req.sellerName : req.buyerName,
    });

    this.set(STORAGE_KEYS.REQUESTS, requests);

    this.logAudit(
      'CONFIRMACAO_RECEPCAO',
      `O utilizador ${userId} confirmou que recebeu os fundos na solicitação ${req.id}. Alarme do Super Admin disparado.`,
      userId,
      'user@quicksend.io',
      'EXCHANGE'
    );

    this.notify();
    return {
      success: true,
      message: 'Receção confirmada com sucesso. O Super Admin foi notificado sonoramente para libertação e conclusão formal.',
    };
  }

  // ========================================================
  // 7. REALTIME CONVERSATIONS & PRIVATE CHAT
  // ========================================================

  public getConversations(): Conversation[] {
    return this.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
  }

  public getMessages(): ChatMessage[] {
    return this.get<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
  }

  public getOrCreateConversation(participantIds: string[], requestId?: string, offerId?: string): Conversation {
    const convs = this.getConversations();
    let conv = convs.find(
      (c) =>
        participantIds.every((id) => c.participantIds.includes(id)) &&
        c.participantIds.length === participantIds.length &&
        (!requestId || c.requestId === requestId)
    );

    if (!conv) {
      const users = this.getUsers();
      const names: Record<string, string> = {};
      const unread: Record<string, number> = {};
      participantIds.forEach((pid) => {
        const u = users.find((usr) => usr.id === pid);
        names[pid] = u?.fullName || 'Utilizador';
        unread[pid] = 0;
      });

      conv = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        participantIds,
        participantNames: names,
        requestId,
        offerId,
        unreadCount: unread,
        isBlocked: false,
      };
      convs.unshift(conv);
      this.set(STORAGE_KEYS.CONVERSATIONS, convs);
    }
    return conv;
  }

  public sendMessage(conversationId: string, senderId: string, content: string, attachmentUrl?: string): ChatMessage | null {
    const convs = this.getConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv) return null;

    if (conv.isBlocked) {
      return null;
    }

    const user = this.getUsers().find((u) => u.id === senderId);
    if (user?.isBlocked || user?.isSuspended) {
      return null;
    }

    const messages = this.getMessages();
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId,
      senderId,
      senderName: user?.fullName || 'Utilizador',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      attachmentUrl,
    };

    messages.push(newMsg);
    this.set(STORAGE_KEYS.MESSAGES, messages);

    // Update conversation metadata
    conv.lastMessage = newMsg.content;
    conv.lastMessageTimestamp = newMsg.timestamp;
    conv.participantIds.forEach((pid) => {
      if (pid !== senderId) {
        conv.unreadCount[pid] = (conv.unreadCount[pid] || 0) + 1;
        // Dispatch in-app notification
        this.addNotification(
          pid,
          `Nova mensagem de ${newMsg.senderName}`,
          newMsg.content.length > 50 ? newMsg.content.substring(0, 50) + '...' : newMsg.content,
          'CHAT'
        );
      }
    });

    this.set(STORAGE_KEYS.CONVERSATIONS, convs);
    this.notify();
    return newMsg;
  }

  // ========================================================
  // 8. REPORTS (DENÚNCIAS) & MODERATION
  // ========================================================

  public getReports(): ReportItem[] {
    return this.get<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
  }

  public submitReport(
    reporterId: string,
    targetUserId: string,
    reason: string,
    details: string,
    severity: ReportItem['severity'],
    offerId?: string,
    requestId?: string
  ): ReportItem {
    const reporter = this.getUsers().find((u) => u.id === reporterId);
    const target = this.getUsers().find((u) => u.id === targetUserId);

    const reports = this.getReports();
    const newReport: ReportItem = {
      id: 'rep_' + Date.now(),
      reporterId,
      reporterName: reporter?.fullName || 'Anónimo',
      targetUserId,
      targetUserName: target?.fullName || 'Utilizador',
      reason,
      details,
      severity,
      status: 'NOVA',
      offerId,
      requestId,
      createdAt: new Date().toISOString(),
    };

    reports.unshift(newReport);
    this.set(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(
      'DENUNCIA_SUBMETIDA',
      `Denúncia submetida por ${newReport.reporterName} contra ${newReport.targetUserName}. Motivo: ${reason}`,
      reporterId,
      reporter?.email || '',
      'MODERATION'
    );

    this.notify();
    return newReport;
  }

  public resolveReport(
    reportId: string,
    status: ReportItem['status'],
    resolution: string,
    adminId: string,
    adminEmail: string
  ): boolean {
    const reports = this.getReports();
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return false;

    rep.status = status;
    rep.adminResolution = resolution;
    rep.resolvedBy = adminId;
    rep.resolvedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.REPORTS, reports);

    this.logAudit(
      'DENUNCIA_RESOLVIDA',
      `Denúncia ${reportId} resolvida com estado: ${status}. Resolução: ${resolution}`,
      adminId,
      adminEmail,
      'MODERATION'
    );

    this.notify();
    return true;
  }

  // ========================================================
  // 9. AUDIT LOGS & NOTIFICATIONS
  // ========================================================

  public getAuditLogs(): AuditLogItem[] {
    return this.get<AuditLogItem[]>(STORAGE_KEYS.AUDIT, []);
  }

  public logAudit(
    action: string,
    details: string,
    performedBy: string,
    performedByEmail: string,
    category: AuditLogItem['category']
  ) {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      action,
      details,
      performedBy,
      performedByEmail,
      category,
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 logs
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.AUDIT, logs);
  }

  public getNotifications(userId?: string): InAppNotification[] {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!userId) return notifs;
    return notifs.filter((n) => n.userId === userId);
  }

  public addNotification(userId: string, title: string, message: string, type: InAppNotification['type'], actionLink?: string) {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs.unshift({
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
      actionLink,
    });
    if (notifs.length > 200) notifs.pop();
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markNotificationAsRead(notifId: string) {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const n = notifs.find((item) => item.id === notifId);
    if (n) {
      n.isRead = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
      this.notify();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    this.notify();
  }

  // ========================================================
  // 10. SUPER ADMIN SOUND ALARM DISPATCHER
  // Continuous audio notification when operations require attention
  // ========================================================

  public checkSuperAdminAlarm() {
    const currentSession = this.getCurrentSession();
    // Only sound the alarm if the logged-in user is a SUPER_ADMIN
    if (!currentSession || currentSession.role !== 'SUPER_ADMIN') {
      if (soundAlarmService.isRunning()) {
        soundAlarmService.stopAlarm();
      }
      return;
    }

    const requests = this.getRequests();
    const pendingPaymentSubs = this.getSubscriptions().filter((s) => s.status === 'PENDENTE');
    const pendingKyc = this.getKycSubmissions().filter((k) => k.status === 'PENDENTE');
    const urgentRequests = requests.filter(
      (r) => r.needsAdminAttention || r.status === 'RECEBIMENTO_CONFIRMADO' || r.status === 'PENDENTE'
    );

    if (urgentRequests.length > 0) {
      const topReq = urgentRequests[0];
      const reason =
        topReq.status === 'RECEBIMENTO_CONFIRMADO'
          ? `🚨 Atenção: ${topReq.sellerName} confirmou que recebeu fundos na operação ${topReq.id}! Aceitação requerida.`
          : `🚨 Nova solicitação de câmbio P2P aguarda validação do Super Admin (${topReq.amount} ${topReq.offerCurrency}).`;

      if (!soundAlarmService.isRunning()) {
        soundAlarmService.startAlarm(reason);
      }
    } else if (pendingPaymentSubs.length > 0) {
      const reason = `🚨 Novo pagamento MB WAY de 20€ aguarda validação de comprovativo.`;
      if (!soundAlarmService.isRunning()) {
        soundAlarmService.startAlarm(reason);
      }
    } else if (pendingKyc.length > 0) {
      const reason = `🚨 Novo documento KYC de identidade aguarda análise do Super Admin.`;
      if (!soundAlarmService.isRunning()) {
        soundAlarmService.startAlarm(reason);
      }
    } else {
      if (soundAlarmService.isRunning()) {
        soundAlarmService.stopAlarm();
      }
    }
  }

  private startPeriodicAlarmCheck() {
    if (this.alarmCheckInterval) clearInterval(this.alarmCheckInterval);
    this.alarmCheckInterval = window.setInterval(() => {
      this.checkSuperAdminAlarm();
    }, 5000);
  }

  public dismissUrgentRequestAttention(requestId: string) {
    const requests = this.getRequests();
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      req.needsAdminAttention = false;
      this.set(STORAGE_KEYS.REQUESTS, requests);
      this.notify();
    }
  }
}

export const db = new DatabaseEngine();
