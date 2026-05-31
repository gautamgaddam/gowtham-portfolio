# 🚀 Quick Start Guide - Phase 1

Get your multi-user portfolio platform up and running in **10 minutes**.

---

## Step 1: Install Dependencies (1 min)

```bash
cd gowtham-portfolio
npm install
```

---

## Step 2: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) and create account
2. Click **"New Project"**
3. Fill in details and wait for it to spin up (~2 min)

---

## Step 3: Get Credentials (1 min)

In Supabase dashboard:

1. Go to **Settings** > **API**
2. Copy:
   - Project URL
   - anon public key
   - service_role key (from Database section)

---

## Step 4: Configure Environment (1 min)

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Keep your existing OpenAI key
OPENAI_API_KEY=sk-...
```

---

## Step 5: Create Database (2 min)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy ENTIRE contents of `supabase/schema.sql`
4. Paste and click **Run**
5. Should see: ✅ "Success. No rows returned"

---

## Step 6: Create Storage Buckets (2 min)

In Supabase dashboard, go to **Storage**:

Create 3 buckets:

1. **avatars** (public ✅)
2. **project-images** (public ✅)
3. **music-files** (private ❌)

---

## Step 7: Start Development Server (1 min)

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Step 8: Test! ✅

1. Click **"Sign Up"** in navbar
2. Create account with:
   - Your name
   - Unique username
   - Email
   - Password (6+ characters)
3. Check email and click verification link
4. You should land on **Dashboard**!

---

## 🎉 Success!

If you see the dashboard with your name, **Phase 1 is working!**

You can now:

- ✅ Sign up users
- ✅ Log in/out
- ✅ Access dashboard
- ✅ View user menu

---

## ❓ Troubleshooting

**"Failed to connect"**
→ Check `.env.local` has correct Supabase URL/keys

**"Username already taken"**
→ Try different username or check `profiles` table in Supabase

**Email not received**
→ Check spam, or manually verify user in Supabase **Authentication** > **Users**

**Build errors**
→ Delete `.next` folder and restart: `rm -rf .next && npm run dev`

---

## 📚 Full Documentation

For detailed explanations:

- **Setup:** `docs/PHASE-1-SETUP.md`
- **Complete:** `docs/PHASE-1-COMPLETE.md`

---

## 🚀 Next: Phase 2

Once working, Phase 2 will add:

- Portfolio builder UI
- Skills and projects CRUD
- Public portfolio pages (`/u/username`)
- Image uploads

**Ready to proceed?** Let me know! 🎯
