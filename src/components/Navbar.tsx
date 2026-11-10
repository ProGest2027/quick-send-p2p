/**
 * Quick Send — Top Navigation Bar (Identidade Bancária)
 * Conforms to Top Bar Contract (3-Zone): Brand Wordmark — 4 Nav Links — 1 Primary Action
 * Inclui ticker institucional superior com cotações oficiais e conexão segura.
 */

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Database,
  Moon,
  Sun,
  User,
  Shield,
  LogOut,
  Bell,
  CheckCircle,
  Menu,
  X,
  CreditCard,
  Crown,
  Lock,
  Landmark,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../services/database';
import { supabaseManager } from '../services/supabaseClient';
import { PWAInstallButton } from './PWAInstallButton';
import { FlagEUR, FlagAOA } from '../utils/currencyFormat';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenSupabaseModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onOpenAuth,
  onOpenSupabaseModal,
  darkMode,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const supabaseStatus = supabaseManager.getStatus();
  const unreadNotifications = currentUser
    ? db.getNotifications(currentUser.id).filter((n) => !n.isRead)
    : [];

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isPremium = currentUser ? db.isUserPremium(currentUser.id) : false;

  const handleLogout = () => {
    db.logout();
    setUserDropdownOpen(false);
    onNavigate('landing');
  };

  return (
    <header className="sticky top-0 z-40 transition-colors">
      {/* 1. Institutional Top Banking Security Ribbon */}
      <div className="bg-[#091122] border-b border-slate-800 text-slate-300 text-[11px] px-3 sm:px-4 py-1.5 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold shrink-0">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Ambiente Protegido SSL 256-bit</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400 font-semibold">Câmbio Oficial:</span>
              <span className="inline-flex items-center gap-1.5 text-blue-300 font-bold">
                <FlagEUR className="w-3.5 h-3.5 shadow-xs" />
                <span>1,00 € = 989,50 Kz</span>
                <FlagAOA className="w-3.5 h-3.5 shadow-xs" />
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold">
                <FlagAOA className="w-3.5 h-3.5 shadow-xs" />
                <span>1.000 Kz = 1,01 €</span>
                <FlagEUR className="w-3.5 h-3.5 shadow-xs" />
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px]">
            <span className="hidden md:inline text-slate-400">
              Liquidação Instantânea: <strong className="text-slate-200">MB WAY (936924849)</strong> &amp; <strong className="text-slate-200">Multicaixa Express</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-800">
              <Landmark className="w-2.5 h-2.5 text-blue-400" />
              Fintech P2P
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar Bar */}
      <div className="bg-white/95 dark:bg-[#0c162c]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark with banking emblem */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0a1128] via-[#1d4ed8] to-[#059669] p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#0a1128] rounded-[10px] flex items-center justify-center text-white relative overflow-hidden">
                <Landmark className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1 rounded-xs">
                  €/Kz
                </span>
              </div>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  QUICK<span className="text-blue-600 dark:text-blue-400">SEND</span>
                </span>
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  BANK P2P
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                Plataforma de Câmbio de Moedas
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => onNavigate('marketplace')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'marketplace'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/60'
                  : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Mercado P2P
            </button>

            <button
              onClick={() => onNavigate('converter')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'converter'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/60'
                  : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Conversor (€ / Kz)
            </button>

            <button
              onClick={() => onNavigate('premium')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'premium'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-800/60'
                  : 'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Plano Premium (20 €)</span>
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate('requests')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  currentTab === 'requests'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/60'
                    : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                Minhas Operações
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* PWA Mobile Install Button */}
            <PWAInstallButton compact />

            {/* Supabase Connection Indicator */}
            <button
              onClick={onOpenSupabaseModal}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                supabaseStatus.isConnected
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
              title="Estado da Conexão Supabase e Base de Dados"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden lg:inline">
                {supabaseStatus.isConnected ? 'Supabase Ativo' : 'Supabase Conectado'}
              </span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Alternar tema claro/escuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  {/* Notifications Bell */}
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Notificações"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>

                  {/* Profile Button */}
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 transition-all text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.fullName}</span>
                    {isSuperAdmin && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 rounded font-black">
                        ADMIN
                      </span>
                    )}
                    {isPremium && !isSuperAdmin && (
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </button>
                </div>

                {/* Profile Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#0c162c] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{currentUser.fullName}</p>
                      <p className="text-slate-400 truncate text-[11px]">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {isSuperAdmin ? 'SUPER ADMIN' : isPremium ? 'CLIENTE PREMIUM' : 'CLIENTE BASE'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Painel da Conta</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('kyc');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Verificação Bancária (KYC)</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('premium');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium flex items-center gap-2"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Plano Premium (20 € MB WAY)</span>
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Painel Super Admin CMS</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Terminar Sessão</span>
                    </button>
                  </div>
                )}

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#0c162c] border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <span className="font-bold text-slate-900 dark:text-white">Avisos & Notificações</span>
                      {currentUser && (
                        <button
                          onClick={() => db.markAllNotificationsAsRead(currentUser.id)}
                          className="text-[11px] text-blue-600 hover:underline font-medium"
                        >
                          Marcar lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {db.getNotifications(currentUser.id).length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          Sem avisos de momento
                        </div>
                      ) : (
                        db.getNotifications(currentUser.id).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => db.markNotificationAsRead(notif.id)}
                            className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                              notif.isRead
                                ? 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-500'
                                : 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60 text-slate-900 dark:text-white'
                            }`}
                          >
                            <div className="font-semibold text-xs leading-tight mb-1">{notif.title}</div>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
                >
                  Aceder à Conta
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap shrink-0"
                >
                  Abrir Conta
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c162c] px-4 pt-3 pb-6 space-y-3 text-sm">
          <button
            onClick={() => {
              onNavigate('marketplace');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-slate-700 dark:text-slate-200"
          >
            Mercado P2P
          </button>
          <button
            onClick={() => {
              onNavigate('converter');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-slate-700 dark:text-slate-200"
          >
            Conversor Oficial (€ / Kz)
          </button>
          <button
            onClick={() => {
              onNavigate('premium');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 font-medium text-slate-700 dark:text-slate-200"
          >
            Plano Premium (20 € MB WAY)
          </button>
          {currentUser && (
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 font-medium text-slate-700 dark:text-slate-200"
            >
              Painel da Conta
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 font-bold text-rose-600 dark:text-rose-400"
            >
              Painel Super Admin CMS
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <PWAInstallButton />
          </div>
        </div>
      )}
    </header>
  );
};
