# Memoria MVP
Stack scelto: Next.js + Supabase.

## Perché
- URL permanenti per memoriale: `/m/[slug]`
- database PostgreSQL gestito da Supabase
- predisposizione per login admin, storage foto/video e moderazione dediche
- frontend indipendente da Wix

## Avvio
1. `npm install`
2. copia `.env.example` in `.env.local` e inserisci le chiavi Supabase
3. esegui `supabase/schema.sql` nel SQL editor Supabase
4. `npm run dev`
5. apri `/m/pinco-pallino-demo` e `/admin`

## Mancante prima della produzione
Autenticazione admin, upload Storage, salvataggio form, generazione QR PNG/SVG, antispam/moderazione dediche, dominio e deploy.
