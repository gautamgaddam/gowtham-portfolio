import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  Person,
  WorkspacePremium,
  Warning,
} from "@mui/icons-material";
import { useAuth } from "../../lib/auth-context";
import { createSupabaseClient } from "../../lib/supabase";

const brutalistCard = {
  border: "4px solid #000",
  boxShadow: "8px 8px #000",
  borderRadius: "12px",
  mb: 4,
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const supabase = createSupabaseClient();

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.fullName,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      })
      .eq("id", user.id);
    setSaving(false);
    if (!error) {
      if (refreshProfile) refreshProfile();
      setSnackbar({
        open: true,
        message: "Profile saved successfully!",
        severity: "success",
      });
    } else {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={56} thickness={5} sx={{ color: "#000" }} />
      </Box>
    );
  }

  if (!user) return null;

  const tier = profile?.subscription_tier || profile?.tier || "free";

  const tierChipProps = {
    free: { label: "Free", color: "default" },
    pro: { label: "Pro", color: "primary" },
    premium: { label: "Premium", color: "success" },
  }[tier] || { label: "Free", color: "default" };

  const tierDescription =
    {
      free: "Access to core portfolio features, public profile, and basic health & music tools.",
      pro: "Everything in Free plus advanced analytics, custom domain support, and priority features.",
      premium:
        "Full access to all features including AI tools, unlimited storage, and dedicated support.",
    }[tier] || "Access to core portfolio features.";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography
        variant="h4"
        fontWeight={900}
        sx={{ mb: 5, letterSpacing: "-1px", textTransform: "uppercase" }}
      >
        Settings
      </Typography>

      {/* ── Section 1: Account Information ── */}
      <Card sx={brutalistCard}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AccountCircle fontSize="medium" />
            <Typography variant="h6" fontWeight={800} textTransform="uppercase">
              Account Information
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: "#000", borderWidth: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              value={user.email || ""}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              label="Username"
              value={profile?.username || "—"}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              label="Member Since"
              value={memberSince}
              InputProps={{ readOnly: true }}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ── Section 2: Profile ── */}
      <Card sx={brutalistCard}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Person fontSize="medium" />
            <Typography variant="h6" fontWeight={800} textTransform="uppercase">
              Profile
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: "#000", borderWidth: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleFormChange}
              fullWidth
              multiline
              minRows={3}
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              label="Website URL"
              name="website"
              value={formData.website}
              onChange={handleFormChange}
              fullWidth
              variant="outlined"
              placeholder="https://yourwebsite.com"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSaveProfile}
                disabled={saving || !supabase}
                sx={{
                  border: "3px solid #000",
                  boxShadow: "4px 4px #000",
                  borderRadius: "8px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  bgcolor: "#000",
                  color: "#fff",
                  px: 4,
                  "&:hover": { bgcolor: "#222", boxShadow: "2px 2px #000" },
                }}
              >
                {saving ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Section 3: Subscription ── */}
      <Card sx={brutalistCard}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <WorkspacePremium fontSize="medium" />
            <Typography variant="h6" fontWeight={800} textTransform="uppercase">
              Subscription
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: "#000", borderWidth: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Chip
              label={tierChipProps.label}
              color={tierChipProps.color}
              sx={{
                fontWeight: 800,
                fontSize: "0.85rem",
                border: "2px solid #000",
              }}
            />
            {tier !== "free" && (
              <Chip
                label="Active"
                sx={{
                  bgcolor: "#4caf50",
                  color: "#fff",
                  fontWeight: 800,
                  border: "2px solid #000",
                }}
              />
            )}
          </Box>

          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            {tierDescription}
          </Typography>

          {tier === "free" ? (
            <Link href="/pricing" passHref legacyBehavior>
              <Button
                component="a"
                variant="contained"
                sx={{
                  border: "3px solid #000",
                  boxShadow: "4px 4px #000",
                  borderRadius: "8px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  bgcolor: "#1976d2",
                  color: "#fff",
                  px: 4,
                  "&:hover": { bgcolor: "#1565c0", boxShadow: "2px 2px #000" },
                }}
              >
                Upgrade to Pro
              </Button>
            </Link>
          ) : (
            <Tooltip title="Billing management coming soon" arrow>
              <span>
                <Button
                  variant="outlined"
                  disabled
                  sx={{
                    border: "3px solid #000",
                    borderRadius: "8px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    px: 4,
                  }}
                >
                  Cancel Subscription
                </Button>
              </span>
            </Tooltip>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4: Danger Zone ── */}
      <Card
        sx={{
          ...brutalistCard,
          border: "4px solid #d32f2f",
          boxShadow: "8px 8px #d32f2f",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Warning fontSize="medium" sx={{ color: "#d32f2f" }} />
            <Typography
              variant="h6"
              fontWeight={800}
              textTransform="uppercase"
              color="error"
            >
              Danger Zone
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: "#d32f2f", borderWidth: 2 }} />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleSignOut}
              sx={{
                border: "3px solid #d32f2f",
                boxShadow: "4px 4px #d32f2f",
                borderRadius: "8px",
                fontWeight: 800,
                textTransform: "uppercase",
                px: 4,
                "&:hover": { boxShadow: "2px 2px #d32f2f" },
              }}
            >
              Sign Out
            </Button>

            <Tooltip title="Contact support to delete your account" arrow>
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  disabled
                  sx={{
                    border: "3px solid #d32f2f",
                    borderRadius: "8px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    px: 4,
                  }}
                >
                  Delete Account
                </Button>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontWeight: 700, border: "2px solid #000" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
