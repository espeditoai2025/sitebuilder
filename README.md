# SiteBuilder AI

MVP per raccogliere richieste di restyling siti web, generare 2 proposte AI, far scegliere al cliente una versione e produrre un preventivo confermabile.

## Stack

- Next.js App Router
- Neon Postgres
- Autenticazione email/password con sessioni nel database
- OpenRouter per analisi e proposte AI
- Vercel per deploy
- Resend opzionale per notifiche email

## Setup locale

1. Installa dipendenze:

```bash
npm install
```

Su Windows, se PowerShell blocca `npm`, usa:

```bash
npm.cmd install
```

2. Crea `.env.local` copiando `.env.example`.

3. Crea le tabelle in Neon usando `neon/schema.sql`.

4. Avvia:

```bash
npm run dev
```

Oppure:

```bash
npm.cmd run dev
```

## Variabili ambiente

- `DATABASE_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` consigliato: `openai/gpt-5.4-mini`
- `RESEND_API_KEY`
- `OWNER_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

Senza `OPENROUTER_API_KEY`, la generazione usa contenuti demo per testare il flusso.

## Deploy su Vercel

1. Vai su Vercel e scegli **Add New Project**.
2. Importa il repository GitHub `espeditoai2025/sitebuilder`.
3. Framework preset: **Next.js**.
4. Build command: `npm run build`.
5. Output directory: lascia vuoto.
6. Aggiungi le variabili ambiente elencate in `.env.example`.
7. Esegui il deploy.

## Setup Neon

1. Apri Neon dal pannello Storage di Vercel.
2. Apri **SQL Editor**.
3. Incolla ed esegui `neon/schema.sql`.
4. Aggiungi in Vercel almeno `DATABASE_URL`.

## AI e notifiche

Per usare AI reale:

- imposta `OPENROUTER_API_KEY`
- opzionale: imposta `OPENROUTER_MODEL`

Per ricevere email quando un cliente conferma:

- imposta `RESEND_API_KEY`
- imposta `OWNER_EMAIL`

## Flusso MVP

1. Utente si registra.
2. Crea un progetto con URL del sito.
3. Genera analisi e 2 proposte.
4. Sceglie una proposta.
5. Il sistema crea un preventivo.
6. Il cliente conferma.
7. Lo stato progetto si aggiorna e, se configurato, parte una email.
