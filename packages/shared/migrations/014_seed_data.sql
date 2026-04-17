-- ============================================================
-- Migration 014: Seed data for development and testing
-- Database: PostgreSQL 15+
-- Description: Inserts 1 plan, 1 admin, 2 consumers, 3 apps
--              with credentials for local dev / integration tests.
-- Owner: Shared (all devs)
-- Idempotent: Uses INSERT ... ON CONFLICT DO NOTHING
-- ============================================================

-- -------------------------------------------------------
-- 1. Subscription Plan: "Plan Básico"
-- -------------------------------------------------------
INSERT INTO subscription_plan (id, name, quota_limit, quota_period)
VALUES (
    '00000000-0000-4000-a000-000000000001',
    'Plan Básico',
    1000,
    'month'
) ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 2. Admin Consumer
--    Convention: business_profile='general' + role is set
--    via JWT payload (role='admin') at login time.
--    Password: Admin123!
-- -------------------------------------------------------
INSERT INTO consumer (
    id, email, password_hash, company_name, contact_name,
    phone, business_profile, status, email_verified, plan_id
) VALUES (
    '00000000-0000-4000-a000-000000000010',
    'admin@segurosbolivar.com',
    '$2b$12$LJ3m4ys3Lk0TSwMCkVc3/.QhXCYxZVHFaqqFGDXVMhBqK8xKZa3Oi',
    'Seguros Bolívar',
    'Administrador',
    NULL,
    'general',
    'active',
    TRUE,
    '00000000-0000-4000-a000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 3. Consumer 1: Empresa Salud SA
--    Password: Test1234!
-- -------------------------------------------------------
INSERT INTO consumer (
    id, email, password_hash, company_name, contact_name,
    phone, business_profile, status, email_verified, plan_id
) VALUES (
    '00000000-0000-4000-a000-000000000011',
    'aliado1@empresa.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Empresa Salud SA',
    'Carlos Gómez',
    '+573001111111',
    'salud',
    'active',
    TRUE,
    '00000000-0000-4000-a000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 4. Consumer 2: Autos del Valle
--    Password: Test1234!
-- -------------------------------------------------------
INSERT INTO consumer (
    id, email, password_hash, company_name, contact_name,
    phone, business_profile, status, email_verified, plan_id
) VALUES (
    '00000000-0000-4000-a000-000000000012',
    'aliado2@empresa.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Autos del Valle',
    'María López',
    '+573002222222',
    'autos',
    'active',
    TRUE,
    '00000000-0000-4000-a000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 5. Applications (3 total)
-- -------------------------------------------------------

-- App 1: belongs to Consumer 1
INSERT INTO application (id, consumer_id, name, description, status)
VALUES (
    '00000000-0000-4000-a000-000000000021',
    '00000000-0000-4000-a000-000000000011',
    'Salud App Móvil',
    'Aplicación móvil para consultas de pólizas de salud',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- App 2: belongs to Consumer 1
INSERT INTO application (id, consumer_id, name, description, status)
VALUES (
    '00000000-0000-4000-a000-000000000022',
    '00000000-0000-4000-a000-000000000011',
    'Salud Web Portal',
    'Portal web para gestión de pólizas de salud',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- App 3: belongs to Consumer 2
INSERT INTO application (id, consumer_id, name, description, status)
VALUES (
    '00000000-0000-4000-a000-000000000023',
    '00000000-0000-4000-a000-000000000012',
    'Autos Cotizador',
    'Cotizador en línea para seguros de autos',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 6. Credentials (one per application)
-- -------------------------------------------------------

-- Credential for App 1
INSERT INTO credential (id, application_id, client_id, client_secret_hash, environment, status)
VALUES (
    '00000000-0000-4000-a000-000000000031',
    '00000000-0000-4000-a000-000000000021',
    'cli_salud_movil_001',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'sandbox',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Credential for App 2
INSERT INTO credential (id, application_id, client_id, client_secret_hash, environment, status)
VALUES (
    '00000000-0000-4000-a000-000000000032',
    '00000000-0000-4000-a000-000000000022',
    'cli_salud_web_002',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'sandbox',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Credential for App 3
INSERT INTO credential (id, application_id, client_id, client_secret_hash, environment, status)
VALUES (
    '00000000-0000-4000-a000-000000000033',
    '00000000-0000-4000-a000-000000000023',
    'cli_autos_cotiz_003',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'sandbox',
    'active'
) ON CONFLICT (id) DO NOTHING;
