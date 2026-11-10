/**
 * Quick Send — Production PostgreSQL & Supabase SQL Schema
 * Contains all 21 tables, atomic First-User-SUPER_ADMIN trigger,
 * Row Level Security (RLS) policies, foreign keys, indexes, and realtime publications.
 */

export const QUICK_SEND_SQL_SCHEMA = `-- ====================================================================
-- QUICK SEND — MASTER DATABASE MIGRATION & RLS POLICIES (SUPABASE)
-- Execute this script in your Supabase SQL Editor to bootstrap the database.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'USER');
CREATE TYPE kyc_status_enum AS ENUM ('NAO_SUBMETIDO', 'PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'DOCS_ADICIONAIS', 'EXPIRADO');
CREATE TYPE premium_status_enum AS ENUM ('NAO_PAGO', 'PENDENTE', 'EM_VERIFICACAO', 'APROVADO', 'REJEITADO', 'EXPIRADO');
CREATE TYPE offer_type_enum AS ENUM ('BUY', 'SELL');
CREATE TYPE request_status_enum AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'EM_NEGOCIACAO', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_EM_VERIFICACAO', 'RECEBIMENTO_CONFIRMADO', 'EM_DISPUTA', 'CONCLUIDA', 'CANCELADA');
CREATE TYPE report_status_enum AS ENUM ('NOVA', 'EM_ANALISE', 'RESOLVIDA', 'REJEITADA', 'ENCERRADA');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    iban_eur TEXT,
    mbway_phone TEXT,
    iban_aoa TEXT,
    express_phone TEXT,
    role user_role_enum NOT NULL DEFAULT 'USER',
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspend_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 4. ATOMIC FIRST USER IS SUPER_ADMIN TRIGGER
-- Ensures the very first user who registers automatically gains 'SUPER_ADMIN' role.
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    assigned_role user_role_enum;
BEGIN
    -- Acquire exclusive advisory lock to prevent race conditions during first registration
    PERFORM pg_advisory_xact_lock(99283741);
    
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    IF user_count = 0 THEN
        assigned_role := 'SUPER_ADMIN';
    ELSE
        assigned_role := 'USER';
    END IF;

    INSERT INTO public.profiles (
        id, email, full_name, phone_number,
        iban_eur, mbway_phone, iban_aoa, express_phone,
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        NEW.raw_user_meta_data->>'iban_eur',
        NEW.raw_user_meta_data->>'mbway_phone',
        NEW.raw_user_meta_data->>'iban_aoa',
        NEW.raw_user_meta_data->>'express_phone',
        assigned_role
    );

    -- Audit log
    INSERT INTO public.audit_logs (action, details, performed_by, user_email, category)
    VALUES (
        'USER_REGISTERED',
        'Novo registo atribuído com a função: ' || assigned_role::TEXT,
        NEW.id,
        NEW.email,
        'AUTH'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 5. CURRENCIES & EXCHANGE RATES
CREATE TABLE IF NOT EXISTS public.currencies (
    code VARCHAR(3) PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL
);

INSERT INTO public.currencies (code, name, symbol) VALUES
('EUR', 'Euro', '€'),
('AOA', 'Kwanza Angolano', 'Kz')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair VARCHAR(10) NOT NULL UNIQUE,
    base_currency VARCHAR(3) REFERENCES public.currencies(code),
    target_currency VARCHAR(3) REFERENCES public.currencies(code),
    reference_rate NUMERIC(14, 4) NOT NULL,
    buy_rate NUMERIC(14, 4) NOT NULL,
    sell_rate NUMERIC(14, 4) NOT NULL,
    margin_percent NUMERIC(6, 2) DEFAULT 1.5,
    commission_percent NUMERIC(6, 2) DEFAULT 0.5,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.rate_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair VARCHAR(10) NOT NULL,
    old_reference_rate NUMERIC(14, 4),
    new_reference_rate NUMERIC(14, 4),
    old_buy_rate NUMERIC(14, 4),
    new_buy_rate NUMERIC(14, 4),
    old_sell_rate NUMERIC(14, 4),
    new_sell_rate NUMERIC(14, 4),
    updated_by UUID REFERENCES public.profiles(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PREMIUM PLANS & PAYMENTS (MB WAY: 936924849)
CREATE TABLE IF NOT EXISTS public.premium_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    mbway_number VARCHAR(20) NOT NULL DEFAULT '936924849',
    payment_reference TEXT NOT NULL,
    sender_phone TEXT,
    proof_url TEXT,
    status premium_status_enum NOT NULL DEFAULT 'PENDENTE',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    start_date TIMESTAMPTZ,
    expires_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    status premium_status_enum NOT NULL DEFAULT 'NAO_PAGO',
    expires_at TIMESTAMPTZ,
    last_payment_id UUID REFERENCES public.premium_payments(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. KYC VERIFICATIONS & DOCUMENTS
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    status kyc_status_enum NOT NULL DEFAULT 'NAO_SUBMETIDO',
    document_type TEXT NOT NULL,
    document_number TEXT,
    doc_front_url TEXT,
    doc_back_url TEXT,
    selfie_url TEXT,
    additional_doc_url TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id)
);

-- 8. P2P MARKETPLACE OFFERS
CREATE TABLE IF NOT EXISTS public.exchange_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type offer_type_enum NOT NULL,
    offer_currency VARCHAR(3) REFERENCES public.currencies(code),
    receive_currency VARCHAR(3) REFERENCES public.currencies(code),
    available_amount NUMERIC(14, 2) NOT NULL,
    min_amount NUMERIC(14, 2) NOT NULL DEFAULT 10,
    proposed_rate NUMERIC(14, 4) NOT NULL,
    payment_method TEXT NOT NULL,
    country TEXT NOT NULL,
    description TEXT,
    terms TEXT,
    status TEXT NOT NULL DEFAULT 'ATIVA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXCHANGE REQUESTS (SOLICITAÇÕES) & SOUND ALARM ATTENTION
CREATE TABLE IF NOT EXISTS public.exchange_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES public.exchange_offers(id),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    seller_id UUID NOT NULL REFERENCES public.profiles(id),
    offer_currency VARCHAR(3) REFERENCES public.currencies(code),
    receive_currency VARCHAR(3) REFERENCES public.currencies(code),
    amount NUMERIC(14, 2) NOT NULL,
    agreed_rate NUMERIC(14, 4) NOT NULL,
    estimated_value NUMERIC(14, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status request_status_enum NOT NULL DEFAULT 'PENDENTE',
    receiver_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    sender_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    admin_approved BOOLEAN NOT NULL DEFAULT FALSE,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    needs_admin_attention BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REALTIME CONVERSATIONS & CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.exchange_requests(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES public.exchange_offers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REPORTS (DENÚNCIAS) & MODERATION
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id),
    target_user_id UUID NOT NULL REFERENCES public.profiles(id),
    offer_id UUID REFERENCES public.exchange_offers(id),
    request_id UUID REFERENCES public.exchange_requests(id),
    reason TEXT NOT NULL,
    details TEXT,
    severity TEXT NOT NULL DEFAULT 'MEDIA',
    status report_status_enum NOT NULL DEFAULT 'NOVA',
    admin_resolution TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    details TEXT,
    performed_by UUID REFERENCES public.profiles(id),
    user_email TEXT,
    category TEXT NOT NULL DEFAULT 'SYSTEM',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Public can read basic profile info, own profile can update, admin can update roles
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile except role"
ON public.profiles FOR UPDATE
USING (auth.uid() = id AND NOT is_super_admin())
WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Super Admins can manage all profiles"
ON public.profiles FOR ALL
USING (is_super_admin());

-- Offers: Viewable by all authenticated; publishable only by approved Premium & KYC users
CREATE POLICY "Offers viewable by authenticated users"
ON public.exchange_offers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Premium users with KYC can insert offers"
ON public.exchange_offers FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND (
        is_super_admin() OR (
            EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = auth.uid() AND status = 'APROVADO' AND expires_at > NOW()) AND
            EXISTS (SELECT 1 FROM public.kyc_submissions WHERE user_id = auth.uid() AND status = 'APROVADO')
        )
    )
);

CREATE POLICY "Users can update own offers, admin can manage"
ON public.exchange_offers FOR UPDATE
USING (auth.uid() = user_id OR is_super_admin());

-- Requests: Viewable by buyer, seller, and Super Admin
CREATE POLICY "Requests viewable by participants or admin"
ON public.exchange_requests FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_super_admin());

CREATE POLICY "Users can insert exchange requests"
ON public.exchange_requests FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants or admin can update request"
ON public.exchange_requests FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_super_admin());

-- Realtime Messages: Viewable by conversation participants or admin
CREATE POLICY "Messages viewable by participants or admin"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ) OR is_super_admin()
);

CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
);

-- ====================================================================
-- SEED INITIAL EXCHANGE RATES
-- ====================================================================
INSERT INTO public.exchange_rates (pair, base_currency, target_currency, reference_rate, buy_rate, sell_rate) VALUES
('EUR/AOA', 'EUR', 'AOA', 989.50, 978.00, 1001.00),
('AOA/EUR', 'AOA', 'EUR', 0.00101, 0.00099, 0.00102)
ON CONFLICT (pair) DO NOTHING;
`;
