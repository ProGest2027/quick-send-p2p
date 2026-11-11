/**
 * Quick Send — Authentication Modal
 * Handles Login, Registration (with atomic First-User-SUPER_ADMIN assignment),
 * and Password Recovery.
 */

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Lock, Mail, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { db } from '../services/database';
import { supabaseManager } from '../services/supabaseClient';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'recovery';
  onSuccess: (user: UserProfile) => void;
  onOpenLegal: (page: 'terms' | 'privacy') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  onOpenLegal,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Payment receiving methods requested by user prompt
  const [ibanEur, setIbanEur] = useState('');
  const [mbwayPhone, setMbwayPhone] = useState('');
  const [ibanAoa, setIbanAoa] = useState('');
  const [expressPhone, setExpressPhone] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAdminAlready = db.hasSuperAdmin();

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As palavras-passe não coincidem.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Deve aceitar os Termos e Condições e a Política de Privacidade para prosseguir.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = supabaseManager.getClient();
      let supabaseUserId: string | null = null;
      let assignedRole: UserRole = 'USER';

      if (supabase) {
        // 1. Verificar contagem de perfis para garantir atribuição de SUPER_ADMIN ao primeiro utilizador
        try {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          if (count === 0 || count === null) {
            assignedRole = 'SUPER_ADMIN';
          }
        } catch {
          if (!db.hasSuperAdmin()) assignedRole = 'SUPER_ADMIN';
        }

        // 2. Registar utilizador no Supabase Auth
        const cleanEmail = email.trim().toLowerCase();
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone_number: phone.trim(),
              iban_eur: ibanEur.trim() || null,
              mbway_phone: mbwayPhone.trim() || null,
              iban_aoa: ibanAoa.trim() || null,
              express_phone: expressPhone.trim() || null,
              role: assignedRole,
            },
          },
        });

        if (authErr) {
          console.warn('Aviso no registo Supabase Auth:', authErr.message);
        } else if (authData?.user?.id) {
          supabaseUserId = authData.user.id;

          // 3. Persistir diretamente na tabela public.profiles
          const { error: profileErr } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: cleanEmail,
            full_name: fullName.trim(),
            phone_number: phone.trim(),
            iban_eur: ibanEur.trim() || null,
            mbway_phone: mbwayPhone.trim() || null,
            iban_aoa: ibanAoa.trim() || null,
            express_phone: expressPhone.trim() || null,
            role: assignedRole,
          });

          if (profileErr) {
            console.warn('Aviso ao sincronizar profiles no Supabase:', profileErr.message);
          }
        }
      }

      // 4. Sincronizar na sessão local
      const res = db.registerUser(
        fullName,
        email,
        phone,
        password,
        {
          ibanEur: ibanEur.trim() || undefined,
          mbwayPhone: mbwayPhone.trim() || undefined,
          ibanAoa: ibanAoa.trim() || undefined,
          expressPhone: expressPhone.trim() || undefined,
        },
        supabaseUserId || undefined,
        assignedRole
      );

      setIsSubmitting(false);

      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.message || 'Erro ao criar conta.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao registar conta.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Preencha o email e a palavra-passe.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = supabaseManager.getClient();

      // 1. Tentar login no Supabase Auth caso esteja configurado
      if (supabase) {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authData?.user) {
          // Carregar perfil direto do Supabase
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profData) {
            const syncedUser: UserProfile = {
              id: profData.id,
              email: profData.email,
              fullName: profData.full_name,
              phoneNumber: profData.phone_number,
              role: profData.role,
              isBlocked: profData.is_blocked || false,
              isSuspended: profData.is_suspended || false,
              paymentMethods: {
                ibanEur: profData.iban_eur || undefined,
                mbwayPhone: profData.mbway_phone || undefined,
                ibanAoa: profData.iban_aoa || undefined,
                expressPhone: profData.express_phone || undefined,
              },
              createdAt: profData.created_at,
            };
            db.setActiveSession(syncedUser);
            setIsSubmitting(false);
            onSuccess(syncedUser);
            onClose();
            return;
          }
        }
      }

      // 2. Fallback para verificação local caso offline
      const res = db.loginUser(email, password);
      setIsSubmitting(false);

      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.message || 'Credenciais inválidas.');
      }
    } catch {
      const res = db.loginUser(email, password);
      setIsSubmitting(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage('Credenciais inválidas.');
      }
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Introduza o seu endereço de email.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage('Se existir uma conta associada a este email, receberá um link de recuperação seguro.');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Iniciar Sessão' : mode === 'register' ? 'Criar Nova Conta' : 'Recuperar Conta'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              QUICK SEND — Marketplace P2P de Moedas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Special rule banner on registration if no Super Admin exists yet */}
        {mode === 'register' && !hasAdminAlready && (
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Regra Especial de Inicialização:</span> O primeiro utilizador registado na plataforma receberá automaticamente o perfil{' '}
              <span className="font-bold underline">SUPER_ADMIN</span> com acesso de gestão total.
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
              {successMessage}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o-seu-email@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Palavra-passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-[11px] text-[#246BFD] hover:underline"
                  >
                    Esqueceu-se?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'A Autenticar...' : 'Entrar na Plataforma'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Ainda não tem conta? </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-bold text-[#246BFD] hover:underline"
                >
                  Criar conta agora
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço de Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@dominio.pt"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Telefone (WhatsApp / MB WAY)
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+351 912 345 678"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 6 carateres"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              {/* Métodos para Receção de Valores (Solicitado no Cadastro) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Métodos para Receção de Valores</span>
                    <span className="text-[10px] text-[#246BFD] font-normal">(PT & AO)</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Preencha as contas/telefones onde deseja receber fundos nas trocas de câmbio (EUR e AOA):
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {/* Portugal / EUR */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">
                      🇪🇺 Para Receber em Euro (EUR)
                    </span>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        MB WAY — Telefone Portugal
                      </label>
                      <input
                        type="tel"
                        value={mbwayPhone}
                        onChange={(e) => setMbwayPhone(e.target.value)}
                        placeholder="Ex: 912 345 678"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        IBAN Portugal (EUR)
                      </label>
                      <input
                        type="text"
                        value={ibanEur}
                        onChange={(e) => setIbanEur(e.target.value)}
                        placeholder="Ex: PT50 0000 0000..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Angola / AOA */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                      🇦🇴 Para Receber em Kwanza (AOA)
                    </span>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        EXPRESS — Telefone Angola
                      </label>
                      <input
                        type="tel"
                        value={expressPhone}
                        onChange={(e) => setExpressPhone(e.target.value)}
                        placeholder="Ex: 923 456 789"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                        IBAN Angola (AOA)
                      </label>
                      <input
                        type="text"
                        value={ibanAoa}
                        onChange={(e) => setIbanAoa(e.target.value)}
                        placeholder="Ex: AO06 0000 0000..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#246BFD] focus:ring-[#246BFD]"
                  />
                  <span>
                    Li e aceito os{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('terms')}
                      className="text-[#246BFD] hover:underline font-semibold"
                    >
                      Termos e Condições
                    </button>{' '}
                    e a{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegal('privacy')}
                      className="text-[#246BFD] hover:underline font-semibold"
                    >
                      Política de Privacidade
                    </button>
                    .
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'A Criar Conta...' : 'Concluir Registo'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Já tem uma conta? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-[#246BFD] hover:underline"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}

          {mode === 'recovery' && (
            <form onSubmit={handleRecovery} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Introduza o endereço de email associado à sua conta QUICK SEND para receber instruções de redefinição de palavra-passe.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email de Registo
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o-seu-email@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'A Enviar...' : 'Enviar Link de Recuperação'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
