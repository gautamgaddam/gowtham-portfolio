const DEFAULT_FULL_ACCESS_EMAILS = ["gautammaddyson@gmail.com"];

export function getFullAccessEmails() {
  const configured = process.env.NEXT_PUBLIC_FULL_ACCESS_EMAILS || "";
  return [
    ...DEFAULT_FULL_ACCESS_EMAILS,
    ...configured
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ];
}

export function hasFullAccess(user, profile) {
  const email = (user?.email || profile?.email || "").toLowerCase();
  return Boolean(email && getFullAccessEmails().includes(email));
}

export function getEffectiveSubscriptionTier(user, profile) {
  if (hasFullAccess(user, profile)) return "premium";
  return profile?.subscription_tier || profile?.tier || "free";
}

export function hasPaidFeatureAccess(user, profile) {
  const tier = getEffectiveSubscriptionTier(user, profile);
  return tier === "pro" || tier === "premium";
}
