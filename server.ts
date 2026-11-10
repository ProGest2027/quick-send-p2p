/**
 * Quick Send — Full-Stack Express Server & PostgreSQL Supabase Bridge
 * Port 3000 — Integrates direct PostgreSQL database access with Vite SPA middleware
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

export const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'MPLA1975mpla#',
  host: process.env.PG_HOST || 'db.gdagbwbhjthcwbscfndi.supabase.co',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'postgres',
  ssl: { rejectUnauthorized: false },
});

// 1. Health & Live Database Status
app.get('/api/db/health', async (_req, res) => {
  try {
    const timeRes = await pool.query('SELECT NOW() as now, version() as version;');
    const profilesRes = await pool.query('SELECT COUNT(*) as count FROM public.profiles;');
    const offersRes = await pool.query('SELECT COUNT(*) as count FROM public.exchange_offers;');
    const requestsRes = await pool.query('SELECT COUNT(*) as count FROM public.exchange_requests;');
    const ratesRes = await pool.query('SELECT pair, reference_rate, buy_rate, sell_rate, last_updated FROM public.exchange_rates ORDER BY pair ASC;');

    res.json({
      connected: true,
      host: 'db.gdagbwbhjthcwbscfndi.supabase.co',
      database: 'postgres',
      timestamp: timeRes.rows[0]?.now,
      version: timeRes.rows[0]?.version,
      counts: {
        profiles: Number(profilesRes.rows[0]?.count || 0),
        offers: Number(offersRes.rows[0]?.count || 0),
        requests: Number(requestsRes.rows[0]?.count || 0),
      },
      rates: ratesRes.rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro na base de dados';
    res.status(500).json({
      connected: false,
      error: message,
    });
  }
});

// 2. Official Exchange Rates
app.get('/api/db/rates', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.exchange_rates ORDER BY pair ASC;');
    res.json(result.rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao obter taxas';
    res.status(500).json({ error: message });
  }
});

app.post('/api/db/rates', async (req, res) => {
  const { pair, referenceRate, buyRate, sellRate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE public.exchange_rates
       SET reference_rate = $1, buy_rate = $2, sell_rate = $3, last_updated = NOW()
       WHERE pair = $4 RETURNING *;`,
      [referenceRate, buyRate, sellRate, pair]
    );

    await pool.query(
      `INSERT INTO public.audit_logs (action, details, user_email, category)
       VALUES ('RATE_UPDATED', $1, 'admin@quicksend.io', 'RATES');`,
      [`Taxa atualizada para ${pair}: Ref=${referenceRate}, Compra=${buyRate}, Venda=${sellRate}`]
    );

    res.json({ success: true, updated: result.rows[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar taxas';
    res.status(500).json({ error: message });
  }
});

// 3. User Profiles & Stats
app.get('/api/db/users', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, phone_number, iban_eur, mbway_phone, iban_aoa, express_phone, role, is_blocked, is_suspended, created_at FROM public.profiles ORDER BY created_at ASC;'
    );
    res.json(result.rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao obter utilizadores';
    res.status(500).json({ error: message });
  }
});

// 4. Mount Vite in Dev or Static in Production
const PORT = 3000;
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QUICK SEND] Full-Stack Server active on http://0.0.0.0:${PORT} with PostgreSQL direct connection`);
  });
}

startServer();
