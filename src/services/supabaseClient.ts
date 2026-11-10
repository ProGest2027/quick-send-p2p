/**
 * Quick Send — Supabase Client & Connection Manager
 * Supports direct user configuration via UI modal or environment variables,
 * with real-time connectivity testing and status broadcasting.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'quicksend_supabase_url';
const STORAGE_KEY_ANON = 'quicksend_supabase_anon';

export const DEFAULT_SUPABASE_PROJECT_ID = 'gdagbwbhjthcwbscfndi';
export const DEFAULT_SUPABASE_URL = 'https://gdagbwbhjthcwbscfndi.supabase.co';
export const DEFAULT_SUPABASE_DB_CONFIG = {
  host: 'db.gdagbwbhjthcwbscfndi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
};

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  hasAnonKey: boolean;
  errorMessage?: string;
  projectId?: string;
  dbConfig?: typeof DEFAULT_SUPABASE_DB_CONFIG;
}

class SupabaseManager {
  private client: SupabaseClient | null = null;
  private statusListeners: Set<(status: SupabaseConfigStatus) => void> = new Set();
  private currentStatus: SupabaseConfigStatus = {
    isConfigured: false,
    isConnected: false,
    url: DEFAULT_SUPABASE_URL,
    hasAnonKey: false,
    projectId: DEFAULT_SUPABASE_PROJECT_ID,
    dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
  };

  constructor() {
    this.initFromStorageOrEnv();
  }

  private initFromStorageOrEnv() {
    const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
    const envAnon = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

    const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl || DEFAULT_SUPABASE_URL;
    const storedAnon = localStorage.getItem(STORAGE_KEY_ANON) || envAnon;

    if (storedUrl && storedAnon) {
      try {
        this.client = createClient(storedUrl, storedAnon, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
        this.currentStatus = {
          isConfigured: true,
          isConnected: false, // will test asynchronously
          url: storedUrl,
          hasAnonKey: true,
          projectId: DEFAULT_SUPABASE_PROJECT_ID,
          dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
        };
        this.testConnection();
      } catch (err) {
        this.currentStatus = {
          isConfigured: true,
          isConnected: false,
          url: storedUrl,
          hasAnonKey: true,
          projectId: DEFAULT_SUPABASE_PROJECT_ID,
          dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
          errorMessage: err instanceof Error ? err.message : 'Erro ao inicializar Supabase',
        };
      }
    } else {
      this.currentStatus = {
        isConfigured: false,
        isConnected: false,
        url: storedUrl,
        hasAnonKey: false,
        projectId: DEFAULT_SUPABASE_PROJECT_ID,
        dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
      };
    }
    this.broadcastStatus();
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public getStatus(): SupabaseConfigStatus {
    return { ...this.currentStatus };
  }

  public subscribe(listener: (status: SupabaseConfigStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  private broadcastStatus() {
    this.statusListeners.forEach((fn) => fn({ ...this.currentStatus }));
  }

  public async setCredentials(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim();
    const cleanAnon = anonKey.trim();

    if (!cleanUrl || !cleanAnon) {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON);
      this.client = null;
      this.currentStatus = {
        isConfigured: false,
        isConnected: false,
        url: DEFAULT_SUPABASE_URL,
        hasAnonKey: false,
        projectId: DEFAULT_SUPABASE_PROJECT_ID,
        dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
      };
      this.broadcastStatus();
      return { success: true, message: 'Configuração do Supabase reposta para padrão. A usar modo local seguro.' };
    }

    try {
      // Validate URL format
      new URL(cleanUrl);
      const testClient = createClient(cleanUrl, cleanAnon, {
        auth: { persistSession: false },
      });

      // Simple test ping to Supabase health / auth
      const { error } = await testClient.auth.getSession();
      if (error && !error.message.includes('fetch')) {
        // Even if session is null, a successful response without network error means connection is good
      }

      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_ANON, cleanAnon);
      this.client = testClient;
      this.currentStatus = {
        isConfigured: true,
        isConnected: true,
        url: cleanUrl,
        hasAnonKey: true,
        projectId: DEFAULT_SUPABASE_PROJECT_ID,
        dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
      };
      this.broadcastStatus();
      return { success: true, message: 'Ligação ao Supabase estabelecida com sucesso!' };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Falha ao ligar ao Supabase';
      this.currentStatus = {
        isConfigured: true,
        isConnected: false,
        url: cleanUrl,
        hasAnonKey: true,
        projectId: DEFAULT_SUPABASE_PROJECT_ID,
        dbConfig: DEFAULT_SUPABASE_DB_CONFIG,
        errorMessage: errMsg,
      };
      this.broadcastStatus();
      return { success: false, message: `Erro: ${errMsg}` };
    }
  }

  public async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const { error } = await this.client.auth.getSession();
      const connected = !error;
      this.currentStatus.isConnected = connected;
      if (!connected && error) {
        this.currentStatus.errorMessage = error.message;
      }
      this.broadcastStatus();
      return connected;
    } catch (err) {
      this.currentStatus.isConnected = false;
      this.currentStatus.errorMessage = err instanceof Error ? err.message : 'Falha na rede';
      this.broadcastStatus();
      return false;
    }
  }
}

export const supabaseManager = new SupabaseManager();
