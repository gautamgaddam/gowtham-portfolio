# ✅ Quick Action Checklist — Start Testing NOW

**Complete these steps in order to start testing immediately.**

---

## Step 1: Update Database Trigger (5 minutes)

### In Supabase Dashboard:

1. Go to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Update the user creation trigger to also create portfolio
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Auto-create portfolio with is_public = true
  INSERT INTO public.portfolios (user_id, is_public)
  VALUES (new.id, true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill portfolios for existing users who don't have one
INSERT INTO public.portfolios (user_id, is_public)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.portfolios)
ON CONFLICT (user_id) DO NOTHING;
```

4. Click **"Run"**
5. Should see: ✅ "Success. No rows returned" (or number of backfilled rows)

---

## Step 2: Verify Database (2 minutes)

Still in Supabase:

1. Go to **Table Editor** → `portfolios`
2. Check that all users have a portfolio row
3. Check that `is_public` = `true` for all rows

**Expected**: Every user from `auth.users` should have a matching `portfolios` entry

---

## Step 3: Restart Dev Server (1 minute)

In your terminal:

```bash
# Stop the server (Ctrl+C)

# Restart
npm run dev:https
```

**Expected**: Server starts on https://localhost:3001

---

## Step 4: Clear Browser Data (1 minute)

1. Open browser in **Incognito/Private mode** OR
2. Clear localStorage:
   - Open DevTools (F12)
   - Console tab
   - Run: `localStorage.clear()`
   - Refresh page

---

## Step 5: Quick Smoke Test (5 minutes)

### Test Authentication:
```
1. Visit https://localhost:3001
2. Click "Sign Up"
3. Create account (use unique username)
4. Check email → Click verification link
5. Should land on dashboard ✅
```

### Test Portfolio:
```
6. Click "Edit Portfolio"
7. Click "Skills" tab → Add a skill
8. Should see success message ✅
9. Skill should appear in list ✅
```

### Test Public Page:
```
10. Click "View Portfolio" from dashboard
11. Should see /u/your-username page ✅
12. Should display your name and skill ✅
```

### Test Subscription Gate:
```
13. Go back to dashboard
14. Click "Health Coach" card
15. Should see upgrade gate (lock icon) ✅
```

**If all 5 checks pass: ✅ Ready for full testing**

---

## Step 6: Run Full Test Suite

Open `MANUAL-TEST-GUIDE.md` and complete all 36 test cases.

**Estimated time**: 1-2 hours

---

## 🐛 If Tests Fail

### Common Issues:

**Issue**: Portfolio page 404  
**Fix**: Check portfolios table has entry for your user

**Issue**: Skills don't load  
**Fix**: Check browser console for errors, verify Supabase connection

**Issue**: Can't add skills/projects  
**Fix**: Check .env.local has correct Supabase keys

**Issue**: Email not received  
**Fix**: Check Supabase → Authentication → Email Templates

---

## 📊 Testing Progress Tracker

- [ ] Step 1: Database trigger updated
- [ ] Step 2: Database verified
- [ ] Step 3: Server restarted
- [ ] Step 4: Browser cleared
- [ ] Step 5: Smoke test passed (5/5 checks)
- [ ] Step 6: Full test suite started
- [ ] Full test suite completed (___/36 tests passed)

---

## 🎯 Success Criteria

**Before marking testing complete:**

- ✅ All 36 manual tests pass
- ✅ Zero JavaScript errors in console
- ✅ No 500/404 errors (except expected ones)
- ✅ All features work on mobile
- ✅ Public portfolios accessible
- ✅ Subscription gates work correctly

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Performance Testing**: Run Lighthouse audit
2. **Accessibility**: Run axe DevTools scan
3. **Security**: Review RLS policies
4. **Deploy**: Push to Vercel staging
5. **Monitor**: Set up error tracking

---

**Questions?** Check:
- `TESTING-PLAN.md` — Comprehensive test plan
- `BUG-FIXES-REPORT.md` — What was fixed
- `MANUAL-TEST-GUIDE.md` — Detailed test scripts

---

**Current Status**: 🟢 Ready to test  
**Estimated Time**: 2-3 hours for complete testing  
**Last Updated**: May 18, 2026
