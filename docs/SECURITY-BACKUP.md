# Operator AI — Security & Backup Guide

## Security Measures Active

### 1. Security Headers
- **X-Frame-Options: DENY** — prevents clickjacking attacks
- **X-Content-Type-Options: nosniff** — prevents MIME sniffing
- **Referrer-Policy** — controls referrer information
- **Permissions-Policy** — restricts browser features
- **Strict-Transport-Security** — forces HTTPS
- **Content-Security-Policy** — restricts content sources

### 2. Rate Limiting
- Chat: 30 requests/minute
- Image generation: 10/minute
- Billing: 5/minute
- General API: 60/minute
- Returns 429 (Too Many Requests) when exceeded

### 3. Authentication
- Supabase Auth with RLS (Row Level Security)
- All API routes check authentication
- JWT tokens with automatic refresh

### 4. Data Protection
- All data encrypted in transit (HTTPS/TLS)
- Supabase encrypts data at rest
- API keys stored in environment variables (never in code)
- GitHub repo is PRIVATE

---

## Backup Strategy

### Automatic (Supabase)
Supabase Pro plan includes:
- Daily automatic backups
- Point-in-time recovery (up to 7 days)
- Upgrade at: https://supabase.com/dashboard/project/euiobhkcbovmypwmvwgi/settings/billing

### Manual Database Backup
Run periodically:
```bash
# Install Supabase CLI if not installed
brew install supabase/tap/supabase

# Login
supabase login

# Dump database
supabase db dump -p YOUR_DB_PASSWORD --project-ref euiobhkcbovmypwmvwgi > backup-$(date +%Y%m%d).sql
```

### Manual Code Backup
```bash
# Local backup
cp -r ~/operator-ai ~/Desktop/OperatorAI-BACKUP-$(date +%Y%m%d)

# iCloud backup
cp -r ~/operator-ai ~/Library/Mobile\ Documents/com~apple~CloudDocs/OperatorAI-BACKUP
```

### Storage Backup (images, videos)
Your Supabase Storage buckets (image-outputs, videos, knowledge) are backed up with your Supabase plan.

---

## Emergency Recovery

### If code is lost:
```bash
git clone https://github.com/rubengomezesp-tech/OperatorAI.git ~/operator-ai
cd ~/operator-ai && pnpm install
```

### If database is corrupted:
Contact Supabase support or restore from daily backup in Dashboard.

### If Vercel is down:
Your code is in GitHub. You can deploy to any other platform (Railway, Render, AWS).

---

## Monthly Security Checklist
- [ ] Rotate Stripe API keys
- [ ] Check Supabase RLS policies
- [ ] Review Vercel access logs
- [ ] Update npm dependencies (`pnpm update`)
- [ ] Verify backups exist
- [ ] Test account deletion flow
