/**
 * Quick Send — PWA Mobile Install Banner & Modal
 * Dedicated Android & iOS native installation experience
 */

import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'ios' | 'android'>('ios');

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  const handleOpenGuide = (platform: 'ios' | 'android') => {
    setGuidePlatform(platform);
    setShowGuide(true);
  };

  const handleAction = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok && isAndroid) {
        handleOpenGuide('android');
      }
    } else if (isIOS) {
      handleOpenGuide('ios');
    } else {
      handleOpenGuide(isAndroid ? 'android' : 'ios');
    }
  };

  return (
    <>
      {compact ? (
        <button
          onClick={handleAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#246BFD] to-blue-600 text-white shadow-xs active:scale-95 transition-all"
          title="Instalar QUICK SEND no telemóvel"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar App</span>
        </button>
      ) : (
        <button
          onClick={handleAction}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all"
        >
          <Smartphone className="w-4 h-4" />
          <span>{isIOS ? 'Instalar no iPhone / iPad' : 'Instalar no Android'}</span>
        </button>
      )}

      {/* Mobile Install Guide Bottom-Sheet Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 pb-8 sm:pb-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#246BFD]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Instalar QUICK SEND
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {guidePlatform === 'ios' ? 'Instruções para iPhone & iPad (iOS)' : 'Instruções para Android'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform switcher tabs */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 text-xs font-semibold">
              <button
                onClick={() => setGuidePlatform('ios')}
                className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                  guidePlatform === 'ios'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Apple iOS (iPhone/iPad)
              </button>
              <button
                onClick={() => setGuidePlatform('android')}
                className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                  guidePlatform === 'android'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Google Android
              </button>
            </div>

            {guidePlatform === 'ios' ? (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Toque no botão Partilhar</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      No navegador Safari, clique no ícone <Share className="w-3.5 h-3.5 inline text-blue-500" /> na barra inferior.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Adicionar ao Ecrã Principal</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      Role para baixo e selecione <PlusSquare className="w-3.5 h-3.5 inline text-emerald-500" /> <strong>"Adicionar ao Ecrã Principal"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Confirmar "Adicionar"</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Toque em "Adicionar" no canto superior direito. O QUICK SEND abrirá como app nativa sem barras do Safari!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Toque nos 3 pontos do Chrome</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      No canto superior direito do Google Chrome, toque no menu de 3 pontos verticais.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Instalar aplicação / Adicionar ao ecrã principal</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Selecione <strong>"Instalar aplicação"</strong> ou <strong>"Adicionar ao ecrã inicial"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Acesso Rápido e Notificações</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      O ícone do QUICK SEND ficará disponível no seu ecrã de aplicações com arranque ultra-rápido.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center gap-2 text-[11px] text-blue-900 dark:text-blue-200">
              <ShieldCheck className="w-4 h-4 text-[#246BFD] shrink-0" />
              <span>Funciona offline com armazenamento local encriptado e sincronização automática.</span>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors"
            >
              Compreendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
