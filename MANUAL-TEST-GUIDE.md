# Manual Testing Guide — Step-by-Step

## 🎯 Purpose
This guide provides step-by-step instructions to test all critical features of the portfolio SaaS platform.

---

## Prerequisites

Before testing, ensure:

✅ **Database schema updated**:
```sql
-- In Supabase SQL Editor, run the migration:
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
  
  INSERT INTO public.portfolios (user_id, is_public)
  VALUES (new.id, true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill portfolios for existing users
INSERT INTO public.portfolios (user_id, is_public)
SELECT id, true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.portfolios);
```

✅ **Dev server running**: `npm run dev:https`  
✅ **Browser**: Use incognito/private mode for clean testing  
✅ **Email**: Have access to your test email inbox  

---

## 🧪 Test Suite 1: Authentication Flow (15 min)

### Test 1.1: Signup

**Steps**:
1. Open browser: `https://localhost:3001`
2. Click **"Sign Up"** in navbar
3. Fill form:
   - Full Name: `Test User`
   - Username: `testuser` (use unique name each time)
   - Email: `your-email+test@example.com`
   - Password: `test12345`
   - Confirm Password: `test12345`
4. Click **"Create Account"**

**Expected**:
- ✅ Shows "Check your email for verification link"
- ✅ No errors in console
- ✅ Email received with verification link

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 1.2: Email Verification

**Steps**:
1. Open email inbox
2. Click verification link in email

**Expected**:
- ✅ Redirects to dashboard
- ✅ Shows welcome message with your name
- ✅ Shows username `@testuser`
- ✅ Shows "FREE" tier badge

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 1.3: Login

**Steps**:
1. Click avatar → **Sign Out**
2. Click **"Login"** in navbar
3. Enter email and password
4. Click **"Sign In"**

**Expected**:
- ✅ Redirects to dashboard
- ✅ Shows same user info

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 1.4: Invalid Login

**Steps**:
1. Sign out
2. Try login with wrong password

**Expected**:
- ✅ Shows error message
- ✅ Doesn't crash

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 2: Portfolio Builder (20 min)

### Test 2.1: Profile Tab

**Steps**:
1. From dashboard, click **"Edit Portfolio"**
2. Should land on Profile tab
3. Fill form:
   - Full Name: `Test User Updated`
   - Bio: `Software developer passionate about building things`
   - Location: `San Francisco, CA`
   - Website: `https://example.com`
4. Click **"Save Profile"**

**Expected**:
- ✅ Shows green success alert "Profile saved successfully!"
- ✅ Data persists when page reloaded
- ✅ No console errors

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.2: Skills Tab — Add Skill

**Steps**:
1. Click **"Skills"** tab
2. Fill form:
   - Category: `JavaScript`
   - Name: `React`
   - Proficiency: `8` (use slider)
3. Click **"Add"** button

**Expected**:
- ✅ Success message appears
- ✅ Skill appears in list immediately
- ✅ Shows: **React** — JavaScript · Proficiency: 8/10
- ✅ Delete button present

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.3: Skills Tab — Add Multiple Skills

**Steps**:
1. Add 3 more skills:
   - `JavaScript` / `TypeScript` / `9`
   - `Backend` / `Node.js` / `7`
   - `Database` / `PostgreSQL` / `8`

**Expected**:
- ✅ All 4 skills appear in list
- ✅ Newest skills appear first (created_at DESC ordering)

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.4: Skills Tab — Delete Skill

**Steps**:
1. Click delete button on one skill

**Expected**:
- ✅ Success message "Skill deleted"
- ✅ Skill removed from list immediately
- ✅ Other skills remain

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.5: Skills Tab — Empty Name Validation

**Steps**:
1. Leave name field empty
2. Click Add

**Expected**:
- ✅ Shows error "Skill name is required"
- ✅ Nothing added to database

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.6: Projects Tab — Add Project

**Steps**:
1. Click **"Projects"** tab
2. Fill form:
   - Title: `Portfolio Website`
   - Description: `Personal portfolio built with Next.js`
   - Tech Stack: `React, Next.js, Material-UI` (comma-separated)
   - GitHub URL: `https://github.com/user/project`
   - Live URL: `https://example.com`
   - Featured: ✅ (toggle ON)
3. Click **"Add"** button

**Expected**:
- ✅ Success message appears
- ✅ Project appears in list
- ✅ Shows title, description, tech chips
- ✅ Shows "Featured" badge (if toggled)
- ✅ GitHub and Live links present
- ✅ Delete button present

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.7: Projects Tab — Multiple Projects

**Steps**:
1. Add 2 more projects (any data)
2. Toggle Featured OFF for one

**Expected**:
- ✅ All 3 projects appear
- ✅ Only the first has Featured badge
- ✅ Tech stack shows as individual chips

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.8: Projects Tab — Delete Project

**Steps**:
1. Click delete button on one project

**Expected**:
- ✅ Success message
- ✅ Project removed immediately

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.9: Projects Tab — Validation

**Steps**:
1. Leave title empty
2. Click Add

**Expected**:
- ✅ Shows error "Project title is required"

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 2.10: Tab Switching

**Steps**:
1. Switch between Profile / Skills / Projects tabs multiple times

**Expected**:
- ✅ Tabs switch smoothly
- ✅ Data persists in each tab
- ✅ No re-fetching on every click

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 3: Public Portfolio (10 min)

### Test 3.1: Visit Own Portfolio

**Steps**:
1. From dashboard, click **"View Portfolio"** button
2. Should navigate to `/u/testuser`

**Expected**:
- ✅ Shows your name as heading
- ✅ Shows @username
- ✅ Shows bio, location, website
- ✅ Skills section displays all skills
- ✅ Each skill has progress bar (e.g., React at 80%)
- ✅ Projects section displays all projects
- ✅ Featured project has green badge
- ✅ Tech stack shows as chips
- ✅ GitHub/Live links work
- ✅ Footer: "Built with MuseForge"

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 3.2: Visit Non-Existent User

**Steps**:
1. Visit `https://localhost:3001/u/nonexistentuser999`

**Expected**:
- ✅ Shows 404 page
- ✅ No crash

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 3.3: Test is_public Flag

**Steps**:
1. In Supabase dashboard, go to **Table Editor** → `portfolios`
2. Find your portfolio row
3. Set `is_public` to `false`
4. Visit `/u/testuser`

**Expected**:
- ✅ Shows 404 page (private portfolio)

**Steps (cont.)**:
5. Set `is_public` back to `true`
6. Refresh page

**Expected**:
- ✅ Portfolio visible again

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 4: Subscription Tiers (10 min)

### Test 4.1: Free Tier — Health Coach Locked

**Steps**:
1. From dashboard, click **Health Coach** card

**Expected**:
- ✅ Shows upgrade gate screen
- ✅ Lock icon displayed
- ✅ Title: "Health Coach is a Pro Feature"
- ✅ Two buttons: "Upgrade to Pro" and "Back to Dashboard"

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 4.2: Free Tier — Music Studio Locked

**Steps**:
1. From dashboard, click **Music Studio** card

**Expected**:
- ✅ Shows upgrade gate screen
- ✅ Music icon displayed
- ✅ Title: "Music Studio is a Pro Feature"

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 4.3: Upgrade to Pro Tier

**Steps**:
1. In Supabase, go to **Table Editor** → `profiles`
2. Find your user
3. Set `subscription_tier` to `pro`
4. Go back to dashboard (refresh)

**Expected**:
- ✅ Tier badge shows "PRO" (blue chip)
- ✅ Health Coach card shows unlocked
- ✅ Music Studio card shows unlocked

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 4.4: Pro Tier — Access Health Coach

**Steps**:
1. Click Health Coach card

**Expected**:
- ✅ Loads HealthChatbot component (no upgrade gate)
- ✅ Shows chat interface

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 4.5: Pro Tier — Access Music Studio

**Steps**:
1. Go back to dashboard
2. Click Music Studio card

**Expected**:
- ✅ Loads MusicStudio component (no upgrade gate)
- ✅ Shows music generation interface

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 5: Settings Page (10 min)

### Test 5.1: View Settings

**Steps**:
1. From dashboard, click **Settings** card

**Expected**:
- ✅ 4 sections visible:
  - Account Information
  - Profile
  - Subscription
  - Danger Zone

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 5.2: Account Information

**Expected**:
- ✅ Shows email (read-only)
- ✅ Shows username (read-only)
- ✅ Shows member since date

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 5.3: Edit Profile

**Steps**:
1. In Profile section, edit:
   - Bio: `Updated bio text`
2. Click **Save**

**Expected**:
- ✅ Green success message
- ✅ Changes persist on reload

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 5.4: Subscription Display

**Expected** (for Pro tier):
- ✅ Shows "PRO" chip (blue)
- ✅ Shows "Active" badge
- ✅ Cancel button disabled with tooltip

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 5.5: Sign Out

**Steps**:
1. In Danger Zone, click **Sign Out**

**Expected**:
- ✅ Redirects to home page (`/`)
- ✅ Navbar shows Login/Signup again
- ✅ User avatar menu gone

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 6: Navigation (10 min)

### Test 6.1: Navbar Links

**Steps** (when logged out):
1. Check navbar has: About, Inventory, Battles, Pricing, Login, Sign Up

**Expected**:
- ✅ All links present
- ✅ All links work

**Steps** (when logged in):
2. Check navbar has: About, Inventory, Battles, Health, Studio, Pricing, User Avatar

**Expected**:
- ✅ Login/Signup replaced with avatar menu

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 6.2: User Dropdown Menu

**Steps**:
1. Click user avatar

**Expected**:
- ✅ Menu opens
- ✅ Shows: Dashboard, View Portfolio, Settings, Sign Out
- ✅ All items clickable

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 6.3: Footer Links

**Steps**:
1. Scroll to footer
2. Check all icons

**Expected**:
- ✅ Home, LinkedIn, X, Battles, Health, Studio, Pricing all present
- ✅ All links work

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 6.4: Mobile Menu

**Steps**:
1. Resize browser to mobile width (< 600px)
2. Click hamburger menu icon

**Expected**:
- ✅ Drawer opens
- ✅ All links present
- ✅ Pricing link included

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 7: Pricing Page (5 min)

### Test 7.1: View Pricing

**Steps**:
1. Visit `/pricing`

**Expected**:
- ✅ 3 tier cards: FREE, PRO, PREMIUM
- ✅ PRO has green "Most Popular" banner
- ✅ PRO has green border and shadow
- ✅ Feature lists match pricing model
- ✅ FREE button: "Get Started Free" → links to signup
- ✅ PRO/PREMIUM buttons: "Coming Soon" (disabled)

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 7.2: FAQ Accordion

**Steps**:
1. Scroll to FAQ section
2. Click each question

**Expected**:
- ✅ 4 questions present
- ✅ Clicking expands/collapses answer
- ✅ Smooth animations

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 🧪 Test Suite 8: Error Handling (10 min)

### Test 8.1: Protected Route Without Auth

**Steps**:
1. Sign out
2. Visit `/dashboard` directly

**Expected**:
- ✅ Redirects to `/auth/login`

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 8.2: Supabase Null Handling

**Steps**:
1. Temporarily comment out env vars in `.env.local`
2. Restart server
3. Visit `/dashboard/portfolio`

**Expected**:
- ✅ Shows "Supabase not configured" message
- ✅ Doesn't crash

**Steps (cont.)**:
4. Restore env vars
5. Restart server

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

### Test 8.3: Network Errors

**Steps**:
1. Open DevTools → Network tab
2. Enable offline mode
3. Try adding a skill

**Expected**:
- ✅ Shows error message (not crash)
- ✅ Form doesn't clear

**Steps (cont.)**:
4. Disable offline mode

**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________________________

---

## 📊 Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| 1. Authentication | 4 | ___ | ___ | _____ |
| 2. Portfolio Builder | 10 | ___ | ___ | _____ |
| 3. Public Portfolio | 3 | ___ | ___ | _____ |
| 4. Subscription Tiers | 5 | ___ | ___ | _____ |
| 5. Settings | 5 | ___ | ___ | _____ |
| 6. Navigation | 4 | ___ | ___ | _____ |
| 7. Pricing | 2 | ___ | ___ | _____ |
| 8. Error Handling | 3 | ___ | ___ | _____ |
| **TOTAL** | **36** | ___ | ___ | _____ |

---

## 🐛 Bugs Found During Testing

| #  | Bug Description | Severity | Page/Component |
|----|-----------------|----------|----------------|
| 1  | _______________ | ________ | ______________ |
| 2  | _______________ | ________ | ______________ |
| 3  | _______________ | ________ | ______________ |

---

## ✅ Sign-Off

**Tester**: _______________  
**Date**: _______________  
**Overall Status**: ⬜ PASS / ⬜ FAIL  
**Ready for Production**: ⬜ YES / ⬜ NO  

**Comments**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
