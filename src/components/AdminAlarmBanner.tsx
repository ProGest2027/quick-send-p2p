/**
 * Quick Send — Admin Continuous Alarm Banner
 * Flashes and announces pending operations requiring immediate Super Admin attention
 */

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, BellRing, ArrowRight, ShieldCheck } from 'lucide-react';
import { soundAlarmService } from '../services/soundAlarm';
import { db } from '../services/database';

interface AdminAlarmBannerProps {
  onOpenAdminPanel: () => void;
}

export const AdminAlarmBanner: React.FC<AdminAlarmBannerProps> = ({ onOpenAdminPanel }) => {
  const [isAlarmActive, setIsAlarmActive] = useState(soundAlarmService.isRunning());
  const [alarmReason, setAlarmReason] = useState(soundAlarmService.getReason());
  const [isMuted, setIsMuted] = useState(soundAlarmService.getIsMuted());

  useEffect(() => {
    const unsubscribe = soundAlarmService.subscribe((active, reason) => {
      setIsAlarmActive(active);
      setAlarmReason(reason || 'Operação requer atenção do administrador');
      setIsMuted(soundAlarmService.getIsMuted());
    });
    return () => unsubscribe();
  }, []);

  if (!isAlarmActive) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white shadow-lg animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div>
            <span className="font-bold tracking-wide uppercase text-xs bg-black/20 px-2 py-0.5 rounded mr-2">
              Alarme Contínuo Admin
            </span>
            <span className="font-medium text-white/95">{alarmReason}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const muted = soundAlarmService.toggleMute();
              setIsMuted(muted);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 rounded-md text-xs font-semibold transition-colors"
            title={isMuted ? 'Ativar som' : 'Silenciar som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-200" /> : <Volume2 className="w-4 h-4 text-emerald-200" />}
            <span>{isMuted ? 'Som Silenciado' : 'Silenciar'}</span>
          </button>

          <button
            onClick={() => {
              soundAlarmService.stopAlarm();
              onOpenAdminPanel();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-900 hover:bg-rose-50 rounded-md text-xs font-bold transition-all shadow-sm"
          >
            <span>Ver no CMS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
