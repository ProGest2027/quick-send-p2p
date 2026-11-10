/**
 * Quick Send — KYC Identity Verification Page
 * Handles document selection (BI, Cartão de Cidadão, Passaporte, Comprovativo de Morada, Selfie),
 * document uploads with client-side preview, submission, and status monitoring.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Camera,
  ArrowRight,
  Info,
} from 'lucide-react';
import { UserProfile, KYCDocumentType } from '../types';
import { db } from '../services/database';

interface KycPageProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}

export const KycPage: React.FC<KycPageProps> = ({ currentUser, onOpenAuth, onNavigate }) => {
  const [docType, setDocType] = useState<KYCDocumentType>('CARTAO_CIDADAO');
  const [docNumber, setDocNumber] = useState('');
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userKyc = currentUser ? db.getUserKyc(currentUser.id) : undefined;
  const isApproved = userKyc?.status === 'APROVADO';

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'O tamanho da imagem não deve exceder 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'front') setFrontPreview(result);
      if (type === 'back') setBackPreview(result);
      if (type === 'selfie') setSelfiePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!docNumber.trim()) {
      setFeedback({ type: 'error', message: 'Introduza o número de identificação do documento.' });
      return;
    }

    if (!frontPreview) {
      setFeedback({ type: 'error', message: 'Por favor carregue a imagem frontal do seu documento de identificação.' });
      return;
    }

    setIsSubmitting(true);
    const res = db.submitKyc(
      currentUser.id,
      docType,
      docNumber,
      frontPreview || undefined,
      backPreview || undefined,
      selfiePreview || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Documentos KYC submetidos com sucesso para validação segura do Super Admin!',
      });
    } else {
      setFeedback({ type: 'error', message: res.message || 'Erro ao submeter documentos.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#246BFD] border border-blue-200 dark:border-blue-800 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Segurança & Conformidade AML</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Verificação de Identidade (KYC)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          A verificação de identidade é obrigatória para publicar ofertas e realizar transações P2P na plataforma.
        </p>
      </div>

      {/* KYC Status Badge */}
      {currentUser && userKyc && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            userKyc.status === 'APROVADO'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : userKyc.status === 'PENDENTE'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : userKyc.status === 'REJEITADO'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            {userKyc.status === 'APROVADO' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : userKyc.status === 'PENDENTE' ? (
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : userKyc.status === 'REJEITADO' ? (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm">
                Estado KYC:{' '}
                {userKyc.status === 'APROVADO'
                  ? 'Identidade Aprovada com Sucesso'
                  : userKyc.status === 'PENDENTE'
                  ? 'Documentos em Análise pelo Super Admin'
                  : userKyc.status === 'REJEITADO'
                  ? 'Documentação Recusada'
                  : userKyc.status === 'DOCS_ADICIONAIS'
                  ? 'Documentação Adicional Requerida'
                  : 'Não Submetido'}
              </div>
              <div className="text-[11px] text-slate-500">
                Tipo: {userKyc.documentType} · Submetido em: {new Date(userKyc.submittedAt).toLocaleDateString('pt-PT')}
              </div>
              {userKyc.rejectionReason && (
                <div className="text-rose-600 dark:text-rose-400 font-semibold pt-1">
                  Nota do Analista: {userKyc.rejectionReason}
                </div>
              )}
            </div>
          </div>

          {isApproved && (
            <button
              onClick={() => onNavigate('marketplace')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
            >
              Publicar no Mercado
            </button>
          )}
        </div>
      )}

      {/* Main Upload Form */}
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isApproved ? 'Atualizar Documento de Identificação' : 'Formulário de Verificação de Identidade'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Os dados são encriptados e analisados com confidencialidade estrita pelo administrador da plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de Documento Oficial
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as KYCDocumentType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
              >
                <option value="CARTAO_CIDADAO">Cartão de Cidadão (Portugal / UE)</option>
                <option value="BILHETE_IDENTIDADE">Bilhete de Identidade (Angola)</option>
                <option value="PASSAPORTE">Passaporte Internacional</option>
                <option value="COMPROVATIVO_MORADA">Comprovativo de Morada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Número do Documento
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Ex: 12345678 9 ZZ0 ou 009281729LA048"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
              />
            </div>
          </div>

          {/* Upload Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Front */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Frente do Documento *
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#246BFD] rounded-2xl p-4 text-center transition-colors h-40 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'front')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt="Frente"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="space-y-1.5 pointer-events-none">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Carregar Frente
                    </span>
                    <span className="text-[10px] text-slate-400 block">PNG, JPG até 5MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Back */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Verso do Documento
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#246BFD] rounded-2xl p-4 text-center transition-colors h-40 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'back')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {backPreview ? (
                  <img
                    src={backPreview}
                    alt="Verso"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="space-y-1.5 pointer-events-none">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Carregar Verso
                    </span>
                    <span className="text-[10px] text-slate-400 block">Se aplicável</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selfie */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selfie com Documento
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#246BFD] rounded-2xl p-4 text-center transition-colors h-40 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'selfie')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {selfiePreview ? (
                  <img
                    src={selfiePreview}
                    alt="Selfie"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="space-y-1.5 pointer-events-none">
                    <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Carregar Selfie
                    </span>
                    <span className="text-[10px] text-slate-400 block">Rosto nítido</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
            <span>
              Certifique-se de que os dados e a fotografia estão legíveis, sem reflexos de luz e com as 4 bordas do documento visíveis.
            </span>
          </div>

          <div>
            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full py-3 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Inicie Sessão para Submeter KYC
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'A Submeter...' : 'Enviar Documentos para Validação'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
