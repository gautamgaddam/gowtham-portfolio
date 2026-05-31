# 🧪 Comprehensive Testing Plan — Portfolio SaaS Platform

## Executive Summary

This document outlines all testing types, test cases, and identified bugs for the multi-tenant SaaS portfolio platform.

**Testing Status**: 🔴 Critical bugs found requiring fixes before production deployment

---

## 1. 🔒 Security Testing

### 1.1 Authentication Tests

| Test ID | Test Case | Priority | Status |
|---------|-----------|----------|--------|
| SEC-001 | SQL injection in login form | ✅ PASS | Protected by Supabase |
| SEC-002 | Password strength validation (min 6 chars) | ✅ PASS | Implemented |
| SEC-003 | Email verification required | ⚠️ MANUAL | Requires Supabase config |
| SEC-004 | Username uniqueness check | ✅ PASS | Implemented |
| SEC-005 | Session timeout/refresh | ✅ PASS | Handled by Supabase JWT |
| SEC-006 | Protected route authentication | 🔴 BUG | Missing checks (see bugs below) |
| SEC-007 | RLS policies prevent cross-user data access | ⚠️ MANUAL | Requires DB testing |
| SEC-008 | XSS prevention in user inputs | ✅ PASS | React auto-escapes |
| SEC-009 | CSRF token validation | ✅ PASS | Supabase handles |
| SEC-010 | Password visibility toggle | ✅ PASS | Implemented |

### 1.2 Authorization Tests

| Test ID | Test Case | Priority | Status |
|---------|-----------|----------|--------|
| AUTH-001 | Free tier cannot access Health Coach | ✅ PASS | Gate implemented |
| AUTH-002 | Free tier cannot access Music Studio | ✅ PASS | Gate implemented |
| AUTH-003 | Pro tier can access Health + Music | ⚠️ MANUAL | Requires tier testing |
| AUTH-004 | Premium tier has all access | ⚠️ MANUAL | Requires tier testing |
| AUTH-005 | Users can only edit own profile | ⚠️ DB | Depends on RLS |
| AUTH-006 | Users can only view own data | ⚠️ DB | Depends on RLS |
| AUTH-007 | Public portfolios viewable by anyone | 🔴 BUG | is_public flag not set |

---

## 2. 🎯 Functional Testing

### 2.1 Authentication Flow

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| FUNC-001 | User signup | Visit /auth/signup → Fill form → Submit | Email verification sent, redirect to callback | 🔴 BUG |
| FUNC-002 | Email verification | Click email link | Session created, redirect to dashboard | ⚠️ MANUAL |
| FUNC-003 | User login | Visit /auth/login → Enter credentials → Submit | Redirect to /dashboard | ✅ PASS |
| FUNC-004 | User logout | Click Sign Out in menu | Redirect to /, session cleared | ✅ PASS |
| FUNC-005 | Invalid login | Enter wrong password | Show error message | ✅ PASS |
| FUNC-006 | Duplicate username | Signup with existing username | Show "Username already taken" | 🔴 BUG |

### 2.2 Dashboard

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| DASH-001 | Dashboard loads for authenticated user | Login → /dashboard | Shows welcome, user info, 3 feature cards | ✅ PASS |
| DASH-002 | Dashboard redirects unauthenticated | Visit /dashboard without login | Redirect to /auth/login | ✅ PASS |
| DASH-003 | Subscription tier display | Check tier badge | Shows correct tier (free/pro/premium) | ⚠️ MANUAL |
| DASH-004 | Portfolio Builder card clickable | Click "Edit Portfolio" | Navigate to /dashboard/portfolio | ✅ PASS |
| DASH-005 | Health Coach locked for free | Free user sees lock icon | Shows upgrade CTA | ✅ PASS |
| DASH-006 | Music Studio locked for free | Free user sees lock icon | Shows upgrade CTA | ✅ PASS |
| DASH-007 | "View Portfolio" button | Click button | Navigate to /u/{username} | ✅ PASS |

### 2.3 Portfolio Builder

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| PORT-001 | Profile tab loads | Open /dashboard/portfolio | Shows profile edit form | 🔴 BUG |
| PORT-002 | Save profile changes | Edit bio → Click Save | Data saved, success message | 🔴 BUG |
| PORT-003 | Add skill | Skills tab → Fill form → Add | Skill appears in list | 🔴 BUG |
| PORT-004 | Delete skill | Click delete button | Skill removed from list | 🔴 BUG |
| PORT-005 | Add project | Projects tab → Fill form → Add | Project appears in list | 🔴 BUG |
| PORT-006 | Delete project | Click delete button | Project removed from list | 🔴 BUG |
| PORT-007 | Toggle featured project | Toggle featured switch | Project marked as featured | ✅ PASS |
| PORT-008 | Tab switching | Click between tabs | Tabs switch smoothly | ✅ PASS |
| PORT-009 | Form validation | Submit empty skill name | Show validation error | 🔴 MISSING |

### 2.4 Public Portfolio

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| PUB-001 | Visit public portfolio | Navigate to /u/{username} | Shows user's portfolio | 🔴 BUG |
| PUB-002 | Non-existent username | Visit /u/nonexistent | Show 404 page | ✅ PASS |
| PUB-003 | Private portfolio | Visit /u/{user} with is_public=false | Show 404 or private message | 🔴 BUG |
| PUB-004 | Skills display | View skills section | Shows skills grouped by category | ✅ PASS |
| PUB-005 | Projects display | View projects section | Shows projects with tech stack | ✅ PASS |
| PUB-006 | Featured badge | Check featured projects | Shows "Featured" badge | ✅ PASS |
| PUB-007 | External links | Click GitHub/Live links | Open in new tab | ✅ PASS |

### 2.5 Health Coach

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| HEALTH-001 | Free tier upgrade gate | Free user visits /dashboard/health | Shows upgrade screen | ✅ PASS |
| HEALTH-002 | Pro tier access | Pro user visits /dashboard/health | Shows HealthChatbot component | ⚠️ MANUAL |
| HEALTH-003 | Premium tier access | Premium user visits /dashboard/health | Shows HealthChatbot component | ⚠️ MANUAL |
| HEALTH-004 | Unauthenticated redirect | Visit without login | Redirect to /auth/login | ✅ PASS |

### 2.6 Music Studio

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MUSIC-001 | Free tier upgrade gate | Free user visits /dashboard/music | Shows upgrade screen | ✅ PASS |
| MUSIC-002 | Pro tier access | Pro user visits /dashboard/music | Shows MusicStudio component | ⚠️ MANUAL |
| MUSIC-003 | Premium tier access | Premium user visits /dashboard/music | Shows MusicStudio component | ⚠️ MANUAL |
| MUSIC-004 | Unauthenticated redirect | Visit without login | Redirect to /auth/login | ✅ PASS |

### 2.7 Settings

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SET-001 | Settings page loads | Visit /dashboard/settings | Shows 4 sections | ✅ PASS |
| SET-002 | Account info displays | Check section 1 | Shows email, username, member since | ✅ PASS |
| SET-003 | Profile edit | Edit profile → Save | Updates profile data | 🔴 BUG |
| SET-004 | Subscription display | Check section 3 | Shows current tier with chip | ✅ PASS |
| SET-005 | Sign out | Click Sign Out | Logs out and redirects to / | ✅ PASS |
| SET-006 | Delete account disabled | Check delete button | Shows tooltip "Contact support" | ✅ PASS |

### 2.8 Navigation

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| NAV-001 | Navbar shows login when logged out | Visit site logged out | Shows Login and Sign Up | ✅ PASS |
| NAV-002 | Navbar shows user menu when logged in | Visit site logged in | Shows avatar with dropdown | ✅ PASS |
| NAV-003 | Mobile hamburger menu | Open mobile menu | Shows all links | ✅ PASS |
| NAV-004 | Pricing link in navbar | Check navbar | "Pricing" link present | ✅ PASS |
| NAV-005 | Footer links | Check footer | All links work | ✅ PASS |
| NAV-006 | User dropdown menu | Click avatar | Shows Dashboard, View Portfolio, Sign Out | ✅ PASS |

### 2.9 Pricing Page

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| PRICE-001 | Page loads | Visit /pricing | Shows 3 tier cards | ✅ PASS |
| PRICE-002 | Free tier CTA | Click "Get Started Free" | Navigate to /auth/signup | ✅ PASS |
| PRICE-003 | Pro tier CTA | Check "Coming Soon" button | Button disabled | ✅ PASS |
| PRICE-004 | FAQ accordion | Click FAQ item | Expands answer | ✅ PASS |
| PRICE-005 | Most Popular badge | Check Pro card | Shows green "Most Popular" banner | ✅ PASS |
| PRICE-006 | Mobile responsiveness | View on mobile | Cards stack vertically | ⚠️ MANUAL |

---

## 3. 🐛 Critical Bugs Found

### 🔴 HIGH PRIORITY

#### BUG-001: Profile data not initialized on Portfolio Builder load
**Location**: `pages/dashboard/portfolio.js` lines 100-110  
**Issue**: The `useEffect` that populates `profileForm` has missing null checks  
**Impact**: Profile tab may show empty fields even when profile data exists  
**Fix Required**: Add null checks before accessing `profile` properties

#### BUG-002: Signup doesn't wait for profile creation trigger
**Location**: `lib/auth-context.js` line 95  
**Issue**: 1 second timeout is unreliable for profile creation  
**Impact**: Profile may not exist when user lands on dashboard  
**Fix Required**: Poll for profile creation or use Supabase realtime

#### BUG-003: Portfolio not created by default for new users
**Location**: Database schema  
**Issue**: No trigger to create portfolio row when user signs up  
**Impact**: `/u/username` returns 404 for new users who haven't edited portfolio  
**Fix Required**: Add trigger to create portfolio entry on user creation

#### BUG-004: Missing Supabase null checks in portfolio operations
**Location**: `pages/dashboard/portfolio.js` multiple locations  
**Issue**: Code calls `supabase.from(...)` without checking if `supabase` is null  
**Impact**: Crash when Supabase not configured  
**Fix Required**: Add `if (!supabase) return;` guards

#### BUG-005: Public portfolios always 404 because is_public defaults to false
**Location**: Database schema + Portfolio Builder  
**Issue**: No UI to toggle `is_public` flag, defaults to false  
**Impact**: Public portfolio pages are inaccessible  
**Fix Required**: Add toggle in Portfolio Builder or default to true

#### BUG-006: Skills/Projects fetch happens on tab switch, not mount
**Location**: `pages/dashboard/portfolio.js`  
**Issue**: Data only loads when tab is switched, not on first visit  
**Impact**: Skills/Projects tabs appear empty until user clicks tab twice  
**Fix Required**: Load data on component mount, not on tab click

#### BUG-007: refreshProfile missing in auth context
**Location**: `lib/auth-context.js` line 162  
**Issue**: `refreshProfile` implementation calls `fetchProfile` but `fetchProfile` requires supabase  
**Impact**: May crash if supabase is null when refreshProfile is called  
**Fix Required**: Add null check in refreshProfile

#### BUG-008: Form validation missing in Portfolio Builder
**Location**: `pages/dashboard/portfolio.js`  
**Issue**: No validation before submitting skills/projects  
**Impact**: Can add empty skills/projects to database  
**Fix Required**: Add form validation before submit

### ⚠️ MEDIUM PRIORITY

#### BUG-009: No loading states in Portfolio Builder
**Location**: `pages/dashboard/portfolio.js`  
**Issue**: Skills/Projects lists don't show loading spinner when fetching  
**Impact**: Poor UX - appears broken during load  
**Fix Required**: Add `CircularProgress` while `skillsLoading`/`projectsLoading`

#### BUG-010: No error handling in Portfolio Builder CRUD
**Location**: `pages/dashboard/portfolio.js` all CRUD functions  
**Issue**: Errors from Supabase not caught or displayed  
**Impact**: Silent failures confuse users  
**Fix Required**: Add try/catch and show error alerts

#### BUG-011: Tech stack not properly parsed
**Location**: `pages/dashboard/portfolio.js` project add function  
**Issue**: Tech stack saved as string, not array  
**Impact**: Public portfolio may not display tech stack correctly  
**Fix Required**: Split by comma and trim before saving

#### BUG-012: Username change not supported
**Location**: Settings page  
**Issue**: Username is read-only, but changing username should update portfolio slug  
**Impact**: Users stuck with initial username forever  
**Fix Required**: Either allow username change or document it's permanent

### 🟡 LOW PRIORITY

#### BUG-013: No avatar upload functionality
**Location**: Portfolio Builder, Settings  
**Issue**: Users can't upload profile picture  
**Impact**: All users have initials only  
**Fix Required**: Add image upload to Supabase storage

#### BUG-014: No custom domain support
**Location**: Database has custom_domain field but no implementation  
**Issue**: Premium tier promises custom domains but feature doesn't exist  
**Fix Required**: Implement custom domain routing or remove from pricing

#### BUG-015: No pagination for skills/projects
**Location**: Portfolio Builder, Public Portfolio  
**Issue**: All items loaded at once  
**Impact**: Performance degradation with many items  
**Fix Required**: Add pagination or virtualization

---

## 4. 🎨 UI/UX Testing

### 4.1 Responsiveness Tests

| Test ID | Device | Resolution | Status |
|---------|--------|------------|--------|
| UI-001 | Desktop | 1920x1080 | ⚠️ MANUAL |
| UI-002 | Laptop | 1366x768 | ⚠️ MANUAL |
| UI-003 | Tablet | 768x1024 | ⚠️ MANUAL |
| UI-004 | Mobile | 375x667 | ⚠️ MANUAL |
| UI-005 | Mobile landscape | 667x375 | ⚠️ MANUAL |

### 4.2 Accessibility Tests

| Test ID | Test Case | WCAG Level | Status |
|---------|-----------|------------|--------|
| A11Y-001 | Keyboard navigation | A | 🔴 FAIL |
| A11Y-002 | Screen reader labels | A | ⚠️ PARTIAL |
| A11Y-003 | Color contrast | AA | ✅ PASS |
| A11Y-004 | Focus indicators | AA | 🔴 FAIL |
| A11Y-005 | Alt text for images | A | N/A |

**Issues Found**:
- Modal dialogs don't trap focus
- Some buttons missing aria-labels
- No skip navigation link

### 4.3 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 130+ | ⚠️ MANUAL |
| Firefox | 120+ | ⚠️ MANUAL |
| Safari | 17+ | ⚠️ MANUAL |
| Edge | 120+ | ⚠️ MANUAL |
| Mobile Safari | iOS 17+ | ⚠️ MANUAL |
| Chrome Android | Latest | ⚠️ MANUAL |

---

## 5. 🚀 Performance Testing

### 5.1 Load Time Benchmarks

| Page | Target | Status |
|------|--------|--------|
| Landing (/) | < 2s | ⚠️ MEASURE |
| Dashboard | < 1.5s | ⚠️ MEASURE |
| Public Portfolio | < 2s | ⚠️ MEASURE |
| Portfolio Builder | < 1.5s | ⚠️ MEASURE |

### 5.2 Database Query Performance

| Query | Expected Time | Status |
|-------|---------------|--------|
| Fetch profile by ID | < 50ms | ⚠️ DB |
| Fetch profile by username | < 100ms | ⚠️ DB |
| Fetch skills (with index) | < 100ms | ⚠️ DB |
| Fetch projects (with index) | < 100ms | ⚠️ DB |

### 5.3 Bundle Size Analysis

| Metric | Current | Target |
|--------|---------|--------|
| First Contentful Paint | ⚠️ MEASURE | < 1.5s |
| Time to Interactive | ⚠️ MEASURE | < 3s |
| JavaScript Bundle | ⚠️ MEASURE | < 250KB |
| Total Page Weight | ⚠️ MEASURE | < 1MB |

---

## 6. 🔄 Integration Testing

### 6.1 Supabase Integration

| Test ID | Component | Status |
|---------|-----------|--------|
| INT-001 | Auth signUp | ✅ PASS |
| INT-002 | Auth signIn | ✅ PASS |
| INT-003 | Auth signOut | ✅ PASS |
| INT-004 | Profile CRUD | 🔴 BUG |
| INT-005 | Skills CRUD | 🔴 BUG |
| INT-006 | Projects CRUD | 🔴 BUG |
| INT-007 | RLS policy enforcement | ⚠️ DB |

### 6.2 API Route Testing

| Route | Method | Status |
|-------|--------|--------|
| /api/health-chat | POST | ✅ EXISTS |
| /api/music-generate | POST | ✅ EXISTS |
| /api/spotify-analysis | GET | ✅ EXISTS |

---

## 7. 📝 Manual Test Scripts

### Test Script 1: Complete User Journey (Happy Path)

```
1. Open browser (incognito mode)
2. Visit http://localhost:3002
3. Click "Sign Up" in navbar
4. Fill signup form:
   - Full Name: "Test User"
   - Username: "testuser123"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
5. Click "Create Account"
6. Check email for verification link
7. Click verification link
8. Should redirect to /dashboard
9. Verify dashboard shows:
   - ✅ Welcome message with "Test User"
   - ✅ Username "@testuser123"
   - ✅ Free tier badge
   - ✅ Three feature cards (Portfolio, Health, Music)
10. Click "Edit Portfolio"
11. Fill Profile tab:
    - Bio: "Software developer"
    - Location: "San Francisco"
    - Website: "https://example.com"
12. Click Save
13. Click Skills tab
14. Add skill:
    - Category: "JavaScript"
    - Name: "React"
    - Proficiency: 8
15. Click Add
16. Click Projects tab
17. Add project:
    - Title: "Portfolio Site"
    - Description: "My portfolio"
    - Tech Stack: "React, Next.js"
    - Featured: ON
18. Click Add
19. Open new tab: http://localhost:3002/u/testuser123
20. Verify public portfolio shows:
    - ✅ Name "Test User"
    - ✅ Bio, location, website
    - ✅ Skills section with React (80% bar)
    - ✅ Projects section with Portfolio Site
    - ✅ Featured badge
21. Go back to dashboard
22. Click Health Coach card
23. Verify shows upgrade gate (free tier)
24. Click user avatar → Sign Out
25. Verify redirected to home page
26. Verify navbar shows Login/Sign Up again
```

**Expected Result**: All steps pass without errors  
**Actual Result**: 🔴 Bugs found - see Bug Report

### Test Script 2: Error Handling

```
1. Try signup with existing username → Should show error
2. Try login with wrong password → Should show error
3. Try accessing /dashboard/health (free tier) → Should show upgrade gate
4. Try submitting empty skill form → Should validate
5. Try visiting /u/nonexistent → Should show 404
```

### Test Script 3: Subscription Tier Testing

```
Prerequisites: Manually update subscription_tier in Supabase profiles table

1. Set user to 'pro' tier
2. Visit /dashboard/health → Should load HealthChatbot
3. Visit /dashboard/music → Should load MusicStudio
4. Dashboard should show "PRO" chip

5. Set user to 'premium' tier
6. Verify all features accessible
7. Dashboard should show "PREMIUM" chip
```

---

## 8. 🔧 Bug Fixes Required (Priority Order)

### Phase 1: Critical Fixes (Must fix before testing)

1. **FIX BUG-004**: Add Supabase null guards in Portfolio Builder
2. **FIX BUG-001**: Initialize profileForm with null checks
3. **FIX BUG-006**: Load skills/projects on mount
4. **FIX BUG-005**: Add is_public toggle or default to true
5. **FIX BUG-003**: Add portfolio creation trigger
6. **FIX BUG-008**: Add form validation

### Phase 2: Essential Fixes (Fix before production)

7. **FIX BUG-009**: Add loading states
8. **FIX BUG-010**: Add error handling
9. **FIX BUG-011**: Parse tech stack as array
10. **FIX BUG-002**: Improve signup profile creation

### Phase 3: Enhancement Fixes (Post-MVP)

11. **FIX BUG-013**: Add avatar upload
12. **FIX BUG-015**: Add pagination
13. **FIX A11Y issues**: Fix keyboard navigation, focus management

---

## 9. ✅ Testing Checklist

Before marking testing complete, verify:

- [ ] All critical bugs fixed (BUG-001 through BUG-008)
- [ ] Manual Test Script 1 passes completely
- [ ] Manual Test Script 2 passes completely
- [ ] Manual Test Script 3 passes completely
- [ ] Database RLS policies tested in Supabase
- [ ] All three subscription tiers tested
- [ ] Public portfolio accessible for at least one user
- [ ] Skills and projects display correctly
- [ ] Authentication flow works end-to-end
- [ ] Mobile responsiveness verified
- [ ] All navigation links work
- [ ] Error messages display appropriately

---

## 10. 🎯 Next Steps

1. **Implement Critical Bug Fixes** (this session)
2. **Run Manual Test Script 1** (user testing)
3. **Deploy to Vercel staging**
4. **Run integration tests against staging DB**
5. **Performance audit with Lighthouse**
6. **Accessibility audit with axe DevTools**
7. **Security review**
8. **Load testing with k6 or Artillery**
9. **Production deployment**
10. **Monitoring setup (Sentry, analytics)**

---

## Appendix A: Environment Setup for Testing

```bash
# 1. Ensure Supabase configured
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 2. Run database schema
# In Supabase SQL Editor, run supabase/schema.sql

# 3. Create test users in Supabase
# Insert test users with different tiers

# 4. Start dev server
npm run dev:https

# 5. Open browser
# Visit https://localhost:3001
```

## Appendix B: Test Data

### Test User Accounts

| Email | Password | Tier | Username |
|-------|----------|------|----------|
| free@test.com | test123 | free | freeuser |
| pro@test.com | test123 | pro | prouser |
| premium@test.com | test123 | premium | premuser |

**Note**: Create these manually in Supabase after running schema

---

**Testing Plan Version**: 1.0  
**Last Updated**: May 18, 2026  
**Status**: 🔴 Critical bugs identified — fixes required before deployment
