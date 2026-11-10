/**
 * Quick Send — Top Navigation Bar
 * Conforms to Top Bar Contract (3-Zone): Brand Wordmark — 4 Nav Links — 1 Primary Action
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
} from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../services/database';
import { supabaseManager } from '../services/supabaseClient';
import { PWAInstallButton } from './PWAInstallButton';

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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#101D35]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark with original fintech emblem */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#101D35] via-[#246BFD] to-[#16A36A] p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#101D35] rounded-[10px] flex items-center justify-center text-white">
              <ArrowLeftRight className="w-4 h-4 text-[#246BFD] group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
              QUICK<span className="text-[#246BFD]">SEND</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
              P2P Exchange
            </span>
          </div>
        </button>

        {/* Zone 2: 4-5 Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('marketplace')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#246BFD] ${
              currentTab === 'marketplace' ? 'text-[#246BFD] font-bold' : ''
            }`}
          >
            Mercado P2P
          </button>

          <button
            onClick={() => onNavigate('converter')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#246BFD] ${
              currentTab === 'converter' ? 'text-[#246BFD] font-bold' : ''
            }`}
          >
            Conversor
          </button>

          <button
            onClick={() => onNavigate('premium')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-[#246BFD] ${
              currentTab === 'premium' ? 'text-[#246BFD] font-bold' : ''
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Plano 20€</span>
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('requests')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#246BFD] ${
                currentTab === 'requests' ? 'text-[#246BFD] font-bold' : ''
              }`}
            >
              Operações
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors whitespace-nowrap shrink-0`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Painel CMS</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action + Utility Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* PWA Mobile Install Button */}
          <PWAInstallButton compact />

          {/* Supabase Connection Indicator */}
          <button
            onClick={onOpenSupabaseModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              supabaseStatus.isConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
            title="Estado da base de dados e Supabase"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {supabaseStatus.isConnected ? 'Supabase Conectado' : 'BD: gdagbw...'}
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
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>

                {/* Profile Button */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 transition-all text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <div className="w-6 h-6 rounded-full bg-[#246BFD] text-white flex items-center justify-center text-[11px] font-bold">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.fullName}</span>
                  {isSuperAdmin && (
                    <span className="text-[10px] px-1 py-0.2 bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 rounded font-bold">
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
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{currentUser.fullName}</p>
                    <p className="text-slate-400 truncate text-[11px]">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isSuperAdmin ? 'Super Administrador' : isPremium ? 'Membro Premium' : 'Conta Gratuita'}
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
                    <User className="w-3.5 h-3.5" />
                    <span>O Meu Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('kyc');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Verificação de Identidade (KYC)</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('premium');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium flex items-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
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
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">Notificações</span>
                    {currentUser && (
                      <button
                        onClick={() => db.markAllNotificationsAsRead(currentUser.id)}
                        className="text-[11px] text-[#246BFD] hover:underline font-medium"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {db.getNotifications(currentUser.id).length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Sem notificações de momento
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
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#246BFD] dark:hover:text-[#246BFD] transition-colors whitespace-nowrap shrink-0"
              >
                Entrar
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#246BFD] hover:bg-blue-600 rounded-xl transition-all shadow-sm whitespace-nowrap shrink-0"
              >
                Criar Conta
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101D35] px-4 pt-3 pb-6 space-y-3 text-sm">
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
            Conversor de Moedas
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
              Dashboard Pessoal
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
              Painel CMS Super Admin
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
