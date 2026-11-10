/**
 * Quick Send — Supabase Setup & PostgreSQL Configuration Modal
 * Configured for project: gdagbwbhjthcwbscfndi
 * Host: db.gdagbwbhjthcwbscfndi.supabase.co:5432
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Key,
  RefreshCw,
  X,
  Server,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import {
  supabaseManager,
  SupabaseConfigStatus,
  DEFAULT_SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_DB_CONFIG,
} from '../services/supabaseClient';
import { QUICK_SEND_SQL_SCHEMA } from '../services/sqlMigrations';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<SupabaseConfigStatus>(supabaseManager.getStatus());
  const [urlInput, setUrlInput] = useState(status.url || DEFAULT_SUPABASE_URL);
  const [anonKeyInput, setAnonKeyInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'postgres' | 'sql'>('status');

  const [dbHealth, setDbHealth] = useState<{
    tested: boolean;
    loading: boolean;
    connected: boolean;
    version?: string;
    counts?: { profiles: number; offers: number; requests: number };
    rates?: Array<{ pair: string; reference_rate: string; buy_rate: string; sell_rate: string }>;
    error?: string;
  }>({ tested: false, loading: false, connected: false });

  const testDirectDb = async () => {
    setDbHealth((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const res = await fetch('/api/db/health');
      const data = await res.json();
      setDbHealth({
        tested: true,
        loading: false,
        connected: !!data.connected,
        version: data.version,
        counts: data.counts,
        rates: data.rates,
        error: data.error,
      });
    } catch (err: unknown) {
      setDbHealth({
        tested: true,
        loading: false,
        connected: false,
        error: err instanceof Error ? err.message : 'Erro ao contactar backend',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      testDirectDb();
    }
  }, [isOpen]);

  const connectionUri = `postgresql://${DEFAULT_SUPABASE_DB_CONFIG.user}:[SUA_SENHA]@${DEFAULT_SUPABASE_DB_CONFIG.host}:${DEFAULT_SUPABASE_DB_CONFIG.port}/${DEFAULT_SUPABASE_DB_CONFIG.database}`;

  useEffect(() => {
    const unsub = supabaseManager.subscribe((newStatus) => {
      setStatus(newStatus);
      if (newStatus.url) {
        setUrlInput(newStatus.url);
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setFeedbackMessage(null);

    const res = await supabaseManager.setCredentials(urlInput || DEFAULT_SUPABASE_URL, anonKeyInput);
    setIsConnecting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(QUICK_SEND_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(connectionUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2500);
  };

  const handleCopyHost = () => {
    navigator.clipboard.writeText(DEFAULT_SUPABASE_DB_CONFIG.host);
    setCopiedHost(true);
    setTimeout(() => setCopiedHost(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#101D35] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#246BFD]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Base de Dados Supabase (PostgreSQL)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {DEFAULT_SUPABASE_PROJECT_ID}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instância vinculada: <span className="font-mono text-slate-700 dark:text-slate-300">{DEFAULT_SUPABASE_DB_CONFIG.host}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-[#246BFD] text-[#246BFD] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configuração API & Chave</span>
          </button>
          <button
            onClick={() => setActiveTab('postgres')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'postgres'
                ? 'border-[#246BFD] text-[#246BFD] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Parâmetros PostgreSQL</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-[#246BFD] text-[#246BFD] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script SQL (21 Tabelas & RLS)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'status' && (
            <>
              {/* Connection Status Badge */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  status.isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                }`}
              >
                {status.isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#246BFD] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm">
                    {status.isConnected
                      ? 'Supabase Conectado e Operacional'
                      : 'Projeto Supabase Identificado'}
                  </div>
                  <p className="leading-relaxed opacity-90">
                    {status.isConnected
                      ? `Conectado ao endpoint: ${status.url}. Autenticação e sincronização em tempo real ativas.`
                      : `A instância Supabase está definida para o projeto ${DEFAULT_SUPABASE_PROJECT_ID}. Insira a chave pública "anon key" para ativar a sincronização em tempo real e autenticação na cloud.`}
                  </p>
                  {status.errorMessage && (
                    <div className="text-rose-600 dark:text-rose-400 font-medium pt-1">
                      Detalhes: {status.errorMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Link Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Onde obter a Anon Public Key?
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    No painel do Supabase em Project Settings &gt; API &gt; Project API keys &gt; anon public.
                  </div>
                </div>
                <a
                  href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#246BFD] hover:bg-blue-600 text-white rounded-lg font-semibold text-xs transition-colors shrink-0"
                >
                  <span>Abrir API Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Project URL do Supabase
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    URL pré-configurado a partir do host <span className="font-mono">{DEFAULT_SUPABASE_DB_CONFIG.host}</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Anon Public Key (chave anónima pública)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKeyInput}
                    onChange={(e) => setAnonKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cole a chave JWT pública do projeto para autenticar a aplicação cliente.
                  </p>
                </div>

                {feedbackMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium ${
                      feedbackMessage.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                    }`}
                  >
                    {feedbackMessage.text}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput(DEFAULT_SUPABASE_URL);
                      setAnonKeyInput('');
                      supabaseManager.setCredentials('', '');
                    }}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                    Repor Padrão
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => supabaseManager.testConnection()}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Testar
                    </button>
                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="px-5 py-2 bg-[#246BFD] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isConnecting ? 'A Ligar...' : 'Guardar e Ativar'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {activeTab === 'postgres' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Parâmetros de Conexão Direta PostgreSQL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Utilize estes dados para ferramentas como DBeaver, TablePlus, psql ou migrações diretas.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={testDirectDb}
                    disabled={dbHealth.loading}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${dbHealth.loading ? 'animate-spin' : ''}`} />
                    <span>{dbHealth.loading ? 'A Testar...' : 'Testar Conexão Direta'}</span>
                  </button>
                  <button
                    onClick={handleCopyHost}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                  >
                    {copiedHost ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHost ? 'Host Copiado!' : 'Copiar Host'}</span>
                  </button>
                </div>
              </div>

              {/* Direct DB Live Status Card */}
              {dbHealth.tested && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    dbHealth.connected
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {dbHealth.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold text-sm">
                      {dbHealth.connected
                        ? 'Conexão Direta ao PostgreSQL Ativa & Validada!'
                        : 'Falha na Conexão Direta'}
                    </div>
                    {dbHealth.connected ? (
                      <div className="space-y-1">
                        <p className="opacity-90">
                          Ligado com sucesso ao cluster Supabase: <span className="font-mono font-semibold">postgres@{DEFAULT_SUPABASE_DB_CONFIG.host}:5432</span>.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
                          <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-medium">
                            Perfis cadastrados: {dbHealth.counts?.profiles ?? 0}
                          </span>
                          <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-medium">
                            Ofertas ativas: {dbHealth.counts?.offers ?? 0}
                          </span>
                          <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-medium">
                            Solicitações: {dbHealth.counts?.requests ?? 0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-rose-600 dark:text-rose-400 font-medium">
                        {dbHealth.error}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Credentials grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Host</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 break-all">
                    {DEFAULT_SUPABASE_DB_CONFIG.host}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Porta</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {DEFAULT_SUPABASE_DB_CONFIG.port}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Base de Dados</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {DEFAULT_SUPABASE_DB_CONFIG.database}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Utilizador</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {DEFAULT_SUPABASE_DB_CONFIG.user}
                  </div>
                </div>
              </div>

              {/* Connection URI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Connection URI (URI de Conexão)</span>
                  <button
                    onClick={handleCopyUri}
                    className="text-[#246BFD] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {copiedUri ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUri ? 'Copiado!' : 'Copiar URI'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] break-all border border-slate-800">
                  {connectionUri}
                </div>
                <p className="text-[11px] text-slate-400">
                  Substitua <code className="text-[#246BFD]">[SUA_SENHA]</code> pela palavra-passe definida aquando da criação da sua base de dados no Supabase.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-4 h-4 text-[#246BFD] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">SSL Obrigatório</div>
                  <p className="text-[11px] opacity-90">
                    O Supabase requer conexões encriptadas por SSL (SSL Mode: Require).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Script de Criação de Tabelas e RLS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Execute este script no SQL Editor do projeto {DEFAULT_SUPABASE_PROJECT_ID}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#246BFD] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir SQL Editor</span>
                  </a>
                  <button
                    onClick={handleCopySchema}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchema ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                <pre>{QUICK_SEND_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1323] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Instância: {DEFAULT_SUPABASE_PROJECT_ID}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
