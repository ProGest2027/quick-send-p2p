/* CORREÇÃO DO TRIGGER DE CRIAÇÃO DE PERFIS NO SUPABASE */

-- 1. Permissões de schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 2. Recriação da função do trigger com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_count INT;
    assigned_role public.user_role_enum;
BEGIN
    -- Contar perfis existentes
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- O primeiro utilizador é SUPER_ADMIN, os restantes são USER
    IF user_count = 0 THEN
        assigned_role := 'SUPER_ADMIN';
    ELSE
        assigned_role := 'USER';
    END IF;

    -- Inserir perfil
    INSERT INTO public.profiles (
        id, email, full_name, phone_number,
        iban_eur, mbway_phone, iban_aoa, express_phone,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        NEW.raw_user_meta_data->>'iban_eur',
        NEW.raw_user_meta_data->>'mbway_phone',
        NEW.raw_user_meta_data->>'iban_aoa',
        NEW.raw_user_meta_data->>'express_phone',
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Aviso no trigger de registo: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Reconectar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();
