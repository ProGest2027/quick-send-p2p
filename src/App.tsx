/**
 * Quick Send — Root Application Component
 * P2P Currency Exchange Marketplace (EUR, AOA)
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Home,
  Crown,
  User,
  ShieldAlert,
  FileCheck,
  RefreshCw,
  BellRing,
  HelpCircle,
} from 'lucide-react';
import { UserProfile } from './types';
import { db } from './services/database';
import { soundAlarmService } from './services/soundAlarm';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminAlarmBanner } from './components/AdminAlarmBanner';
import { SupabaseModal } from './components/SupabaseModal';
import { ConverterWidget } from './components/ConverterWidget';

import { LandingPage } from './pages/LandingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { PremiumPage } from './pages/PremiumPage';
import { KycPage } from './pages/KycPage';
import { UserDashboard } from './pages/UserDashboard';
import { ExchangeRequestsPage } from './pages/ExchangeRequestsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './pages/AuthModal';
import { ChatModal } from './pages/ChatModal';
import { ReportModal } from './pages/ReportModal';
import { LegalModal } from './pages/LegalPages';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(db.getCurrentSession());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('quicksend_theme') === 'dark';
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [legalModalPage, setLegalModalPage] = useState<'terms' | 'privacy' | 'cookies' | null>(null);

  // Chat modal state
  const [chatState, setChatState] = useState<{
    isOpen: boolean;
    targetUserId: string;
    requestId?: string;
    offerId?: string;
  }>({
    isOpen: false,
    targetUserId: '',
  });

  // Report modal state
  const [reportState, setReportState] = useState<{
    isOpen: boolean;
    targetUserId: string;
    requestId?: string;
    offerId?: string;
  }>({
    isOpen: false,
    targetUserId: '',
  });

  // Theme synchronization with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('quicksend_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('quicksend_theme', 'light');
    }
  }, [darkMode]);

  // Subscribe to database engine updates
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setCurrentUser(db.getCurrentSession());
    });
    return () => unsub();
  }, []);

  // Request audio permission and setup alarm click listener
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundAlarmService.unlockAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleOpenChat = (targetUserId: string, requestId?: string, offerId?: string) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setChatState({
      isOpen: true,
      targetUserId,
      requestId,
      offerId,
    });
  };

  const handleOpenReportModal = (targetUserId: string, requestId?: string, offerId?: string) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    setReportState({
      isOpen: true,
      targetUserId,
      requestId,
      offerId,
    });
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1323] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Super Admin Sound Alarm Banner */}
      {isSuperAdmin && (
        <AdminAlarmBanner onOpenAdminPanel={() => setCurrentTab('admin')} />
      )}

      {/* First Super Admin Notice if system has 0 users */}
      {!db.hasSuperAdmin() && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs py-2 px-4 text-center font-medium shadow-sm flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            <strong>Configuração Inicial:</strong> Nenhum administrador registado ainda. O <strong>primeiro utilizador</strong> a criar conta receberá automaticamente o perfil de <strong>SUPER_ADMIN</strong>.
          </span>
          <button
            onClick={() => handleOpenAuth('register')}
            className="underline font-bold ml-1 hover:text-amber-100"
          >
            Registar Agora
          </button>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-24 sm:pb-8">
        {currentTab === 'landing' && (
          <LandingPage onNavigate={setCurrentTab} onOpenAuth={handleOpenAuth} />
        )}

        {currentTab === 'marketplace' && (
          <MarketplacePage
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onNavigate={setCurrentTab}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentTab === 'converter' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Conversor de Moedas QUICK SEND
              </h1>
              <p className="text-xs text-slate-500">
                Cotações institucionais de referência atualizadas pelo Super Admin.
              </p>
            </div>
            <ConverterWidget onGoToMarketplace={() => setCurrentTab('marketplace')} />
          </div>
        )}

        {currentTab === 'premium' && (
          <PremiumPage
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'kyc' && (
          <KycPage
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('login')}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'requests' && currentUser && (
          <ExchangeRequestsPage
            currentUser={currentUser}
            onOpenChat={handleOpenChat}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {currentTab === 'dashboard' && currentUser && (
          <UserDashboard
            currentUser={currentUser}
            onNavigate={setCurrentTab}
            onOpenChat={handleOpenChat}
          />
        )}

        {currentTab === 'admin' && (
          isSuperAdmin ? (
            <AdminDashboard
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onOpenChat={handleOpenChat}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Acesso Restrito ao Super Admin</h2>
              <p className="text-xs text-slate-500">
                Esta área é exclusiva para a conta com perfil SUPER_ADMIN.
              </p>
              <button
                onClick={() => setCurrentTab('landing')}
                className="px-4 py-2 bg-[#246BFD] text-white text-xs font-bold rounded-xl"
              >
                Voltar à Página Principal
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={setCurrentTab} onOpenLegal={setLegalModalPage} />

      {/* Native Mobile Bottom Navigation (Android & iOS) */}
      <MobileBottomNav
        activeTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'home') {
            setCurrentTab('landing');
          } else {
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        pendingRequestsCount={
          currentUser
            ? isSuperAdmin
              ? db.getRequests().filter(
                  (r) =>
                    r.status === 'RECEBIMENTO_CONFIRMADO' ||
                    r.status === 'PAGAMENTO_EM_VERIFICACAO'
                ).length
              : db
                  .getRequests()
                  .filter(
                    (r) =>
                      (r.buyerId === currentUser.id || r.sellerId === currentUser.id) &&
                      (r.status === 'EM_NEGOCIACAO' ||
                        r.status === 'AGUARDANDO_PAGAMENTO' ||
                        r.status === 'PAGAMENTO_EM_VERIFICACAO')
                  ).length
            : 0
        }
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onOpenLegal={(page) => setLegalModalPage(page)}
      />

      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      <LegalModal
        page={legalModalPage}
        onClose={() => setLegalModalPage(null)}
      />

      {currentUser && (
        <>
          <ChatModal
            isOpen={chatState.isOpen}
            onClose={() => setChatState({ isOpen: false, targetUserId: '' })}
            currentUser={currentUser}
            targetUserId={chatState.targetUserId}
            requestId={chatState.requestId}
            offerId={chatState.offerId}
            onOpenReportModal={(targetId) => {
              setChatState({ isOpen: false, targetUserId: '' });
              handleOpenReportModal(targetId, chatState.requestId, chatState.offerId);
            }}
          />

          <ReportModal
            isOpen={reportState.isOpen}
            onClose={() => setReportState({ isOpen: false, targetUserId: '' })}
            reporterId={currentUser.id}
            targetUserId={reportState.targetUserId}
            requestId={reportState.requestId}
            offerId={reportState.offerId}
          />
        </>
      )}
    </div>
  );
}
