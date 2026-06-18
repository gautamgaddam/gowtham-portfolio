# 🚀 Phase 1 Setup Guide: Authentication & Foundation

## ✅ What Was Implemented

Phase 1 transforms your static portfolio into a multi-user SaaS platform with:

- **Supabase Authentication** - User signup, login, logout
- **User Profiles** - Stored in PostgreSQL database
- **Protected Routes** - Dashboard and features require auth
- **Auth Context** - Global auth state management
- **Login/Signup Pages** - Beautiful UI with validation
- **Updated Navbar** - Shows auth status and user menu
- **Dashboard** - Central hub for users

---

## 📋 Setup Steps

### **Step 1: Install Dependencies**

```bash
cd gowtham-portfolio
npm install
```

This will install the new dependencies added to `package.json`:

- `@supabase/supabase-js`
- `@supabase/auth-helpers-nextjs`

### **Step 2: Create Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: portfolioflow (or your choice)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### **Step 3: Get Supabase Credentials**

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
3. Go to **Settings** > **Database** and copy:
   - **service_role key** (for admin operations)

### **Step 4: Set Up Environment Variables**

1. Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

2. Fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI API Key (keep existing)
OPENAI_API_KEY=your_existing_openai_key

# ElevenLabs API Key (keep existing if you have it)
ELEVENLABS_API_KEY=your_existing_elevenlabs_key

# Spotify API (keep existing if you have it)
SPOTIFY_CLIENT_ID=your_existing_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_existing_spotify_client_secret

# Stability AI music generation
STABILITY_API_KEY=your_stability_api_key
STABILITY_AUDIO_ENDPOINT=https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio
STABILITY_AUDIO_DURATION_SECONDS=30
STABILITY_AUDIO_OUTPUT_FORMAT=mp3

# Optional external music feature enrichment
MUSIC_FEATURES_API_URL=
MUSIC_FEATURES_API_KEY=

# Pinecone Vector DB (we'll set this up in Phase 3)
PINECONE_API_KEY=add_later
PINECONE_ENVIRONMENT=add_later
PINECONE_INDEX_NAME=health-knowledge

# Stripe (we'll add this in Phase 5)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=add_later
STRIPE_SECRET_KEY=add_later
STRIPE_WEBHOOK_SECRET=add_later

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PortfolioFlow
```

### **Step 5: Create Database Schema**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for confirmation (should take ~10 seconds)

You should see: ✅ **Success. No rows returned**

### **Step 6: Create Storage Buckets**

1. In Supabase dashboard, go to **Storage**
2. Create these buckets:

   **Bucket 1: avatars**
   - Click "New bucket"
   - Name: `avatars`
   - Public: ✅ Yes
   - Click "Create"

   **Bucket 2: project-images**
   - Name: `project-images`
   - Public: ✅ Yes
   - Click "Create"

   **Bucket 3: music-files**
   - Name: `music-files`
   - Public: ❌ No (private)
   - Click "Create"

3. For each bucket, set up RLS policies:
   - Click the bucket name
   - Go to "Policies" tab
   - Click "New policy"
   - Choose "For full customization, create a policy from scratch"

   **For `avatars` and `project-images`:**

   ```sql
   -- SELECT policy (anyone can view)
   CREATE POLICY "Anyone can view" ON storage.objects
   FOR SELECT USING (bucket_id = 'avatars');

   -- INSERT policy (users can upload to their own folder)
   CREATE POLICY "Users can upload own files" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'avatars' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **For `music-files`:**

   ```sql
   -- Users can only access their own files
   CREATE POLICY "Users access own music" ON storage.objects
   FOR ALL USING (
     bucket_id = 'music-files' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### **Step 7: Configure Authentication**

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. **Email provider** should be enabled by default
3. (Optional) Enable social logins:
   - Google
   - GitHub
   - Follow Supabase's setup guide for each

4. Go to **Authentication** > **URL Configuration**
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback` (for production)

5. Go to **Authentication** > **Email Templates**
   - Customize signup confirmation email (optional)
   - Update redirect URL to: `{{ .SiteURL }}/auth/callback`

### **Step 8: Test the Application**

1. Start the development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. **Test Signup Flow:**
   - Click "Sign Up" in navbar
   - Fill in the form:
     - Full Name: Your Name
     - Username: yourusername (alphanumeric, unique)
     - Email: your@email.com
     - Password: (at least 6 characters)
   - Click "Sign Up"
   - Check your email for confirmation link
   - Click the link to verify

4. **Test Login Flow:**
   - Click "Login" in navbar
   - Enter your email and password
   - Should redirect to `/dashboard`

5. **Test Dashboard:**
   - See your profile information
   - Three feature cards should display
   - "Portfolio Builder" should be unlocked
   - "Health Coach" and "Music Studio" should be locked (free tier)

6. **Test User Menu:**
   - Click your avatar in navbar
   - Should see dropdown with:
     - Dashboard
     - View Portfolio
     - Sign Out
   - Click "Sign Out"
   - Should redirect to home page

---

## 🎯 What You Can Do Now

After Phase 1 setup, users can:

✅ **Sign up** for an account  
✅ **Log in** and log out  
✅ **Access dashboard**  
✅ **View their profile**  
✅ **Navigate to feature pages** (though features aren't connected yet)

---

## 🔍 Verify Everything Works

### **Check Database**

1. Go to Supabase dashboard > **Table Editor**
2. You should see these tables:
   - `profiles`
   - `portfolios`
   - `skills`
   - `projects`
   - `health_profiles`
   - `health_conversations`
   - `music_generations`
   - `usage_tracking`

3. Click on `profiles` table
4. You should see your test user profile

### **Check Authentication**

1. Go to Supabase dashboard > **Authentication** > **Users**
2. You should see your test user listed
3. Status should show "Confirmed" (after email verification)

---

## 🐛 Troubleshooting

### **Error: "Failed to connect to Supabase"**

- Check that `.env.local` exists and has correct credentials
- Restart the dev server after creating `.env.local`
- Verify `NEXT_PUBLIC_SUPABASE_URL` starts with `https://`

### **Error: "Username already taken"**

- The username must be unique
- Try a different username
- Check the `profiles` table in Supabase to see existing usernames

### **Error: "Invalid credentials"**

- Make sure email is verified (check your inbox)
- Password must be at least 6 characters
- Try resetting password via Supabase dashboard

### **Email not received**

- Check spam folder
- In Supabase dashboard, go to **Authentication** > **Users**
- Click the three dots next to your user > "Send Magic Link"
- Or manually set email to "Confirmed" for testing

### **Pages not found (404)**

- Make sure all new files were created:
  - `lib/supabase.js`
  - `lib/auth-context.js`
  - `pages/auth/login.js`
  - `pages/auth/signup.js`
  - `pages/auth/callback.js`
  - `pages/dashboard/index.js`

### **Build errors**

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📊 Database Structure Created

```
Users (auth.users) - Managed by Supabase Auth
    ↓
profiles - User profile information
    ↓
├── portfolios - Portfolio settings
├── skills - User's skills
├── projects - User's projects
├── health_profiles - Health information
├── health_conversations - Health chat history
├── music_generations - Music creations
└── usage_tracking - Feature usage limits
```

---

## 🎉 Success Criteria

Phase 1 is complete when:

- ✅ Users can sign up and receive confirmation email
- ✅ Users can log in with email/password
- ✅ Dashboard loads with user information
- ✅ Navbar shows user avatar and menu when logged in
- ✅ Users can log out
- ✅ Profile is created in database on signup
- ✅ All pages are accessible without errors

---

## 🚀 Next Steps

You're now ready for **Phase 2: Portfolio Builder**!

Phase 2 will add:

- Portfolio customization UI
- Skills CRUD operations
- Projects CRUD operations
- Template system
- Public portfolio pages (`/u/username`)
- Image upload functionality

Let me know when you're ready to proceed with Phase 2! 🎯
