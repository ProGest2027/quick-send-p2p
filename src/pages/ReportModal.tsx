/**
 * Quick Send — Abuse & Fraud Report Modal
 * Enables reporting suspicious activity, fake proofs, or abusive behavior.
 */

import React, { useState } from 'react';
import { X, Flag, AlertTriangle, ShieldAlert } from 'lucide-react';
import { db } from '../services/database';
import { ReportSeverity } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  targetUserId: string;
  requestId?: string;
  offerId?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reporterId,
  targetUserId,
  requestId,
  offerId,
}) => {
  const [reason, setReason] = useState('Comportamento suspeito ou fraude');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<ReportSeverity>('MEDIA');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    db.submitReport(reporterId, targetUserId, reason, details, severity, offerId, requestId);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600">
            <Flag className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Submeter Denúncia à Moderação
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold text-center space-y-1">
            <p>Denúncia registada com sucesso!</p>
            <p className="text-[11px] font-normal">O Super Admin foi notificado e irá analisar o caso com prioridade.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo da Denúncia
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="Tentativa de Fraude ou Não Envio de Fundos">Tentativa de Fraude / Não Envio de Fundos</option>
                <option value="Perfil Falso ou Documento Suspeito">Perfil Falso / Documento Suspeito</option>
                <option value="Comportamento Abusivo ou Ameaçador">Comportamento Abusivo ou Ameaçador</option>
                <option value="Oferta com Valores Irreais ou Isca">Oferta com Valores Irreais / Isca</option>
                <option value="Outro">Outro Motivo Grave</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nível de Gravidade
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['BAIXA', 'MEDIA', 'ALTA'] as ReportSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 rounded-lg font-bold border transition-colors ${
                      severity === sev
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descrição dos Factos e Provas
              </label>
              <textarea
                required
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Descreva detalhadamente o ocorrido..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Enviar Denúncia para o Super Admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
