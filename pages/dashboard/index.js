import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
} from "@mui/material";
import { useAuth } from "../../lib/auth-context";
import {
  Dashboard as DashboardIcon,
  Person,
  HealthAndSafety,
  MusicNote,
  Settings,
  Visibility,
  Edit,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import {
  getEffectiveSubscriptionTier,
  hasFullAccess,
  hasPaidFeatureAccess,
} from "../../lib/access";

export default function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6">Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const subscriptionColor = {
    free: "default",
    pro: "primary",
    premium: "success",
  };
  const effectiveTier = getEffectiveSubscriptionTier(user, profile);
  const hasPremiumOverride = hasFullAccess(user, profile);
  const hasProAccess = hasPaidFeatureAccess(user, profile);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 4,
        pb: 8,
        backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            border: "4px solid #000",
            borderRadius: "12px",
            boxShadow: "8px 8px #000",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
                : "linear-gradient(135deg, #66bb6a 0%, #43a047 100%)",
            color: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                border: "3px solid #000",
                fontSize: "2rem",
              }}
            >
              {profile.full_name?.[0] || profile.username?.[0] || "U"}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Welcome back, {profile.full_name || profile.username}!
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography variant="body1">@{profile.username}</Typography>
                <Chip
                  label={
                    hasPremiumOverride
                      ? "FULL ACCESS"
                      : effectiveTier.toUpperCase()
                  }
                  color={subscriptionColor[effectiveTier] || "default"}
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </Box>
            </Box>
            <Link href={`/u/${profile.username}`} passHref legacyBehavior>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                sx={{
                  color: "#fff",
                  borderColor: "#fff",
                  "&:hover": {
                    borderColor: "#000",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                View Portfolio
              </Button>
            </Link>
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          {/* Portfolio Builder */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                border: "3px solid #000",
                borderRadius: "12px",
                boxShadow: "6px 6px #000",
                "&:hover": {
                  transform: "translate(2px, 2px)",
                  boxShadow: "4px 4px #000",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Person sx={{ fontSize: 40, color: "#66bb6a", mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Portfolio Builder
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create and customize your professional portfolio with
                  projects, skills, and more.
                </Typography>
                <Chip label="All Tiers" color="success" size="small" />
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Link href="/dashboard/portfolio" passHref legacyBehavior>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Edit />}
                    sx={{
                      background:
                        "linear-gradient(135deg, #66bb6a 0%, #43a047 100%)",
                      border: "2px solid #000",
                      boxShadow: "3px 3px #000",
                      "&:hover": {
                        transform: "translate(1px, 1px)",
                        boxShadow: "2px 2px #000",
                      },
                    }}
                  >
                    Edit Portfolio
                  </Button>
                </Link>
              </CardActions>
            </Card>
          </Grid>

          {/* Health Coach */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                border: "3px solid #000",
                borderRadius: "12px",
                boxShadow: "6px 6px #000",
                "&:hover": {
                  transform: "translate(2px, 2px)",
                  boxShadow: "4px 4px #000",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <HealthAndSafety
                    sx={{ fontSize: 40, color: "#f44336", mr: 2 }}
                  />
                  <Typography variant="h6" fontWeight="bold">
                    Health Coach
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Evidence-based health guidance with personalized meal plans
                  and tracking.
                </Typography>
                <Chip
                  label={hasProAccess ? "Unlocked" : "Pro/Premium"}
                  color={hasProAccess ? "success" : "warning"}
                  size="small"
                />
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Link href="/dashboard/health" passHref legacyBehavior>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<HealthAndSafety />}
                    disabled={!hasProAccess}
                    sx={{
                      background:
                        "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                      border: "2px solid #000",
                      boxShadow: "3px 3px #000",
                      "&:hover": {
                        transform: "translate(1px, 1px)",
                        boxShadow: "2px 2px #000",
                      },
                      "&:disabled": {
                        background: "#ccc",
                        color: "#666",
                      },
                    }}
                  >
                    Open Coach
                  </Button>
                </Link>
              </CardActions>
            </Card>
          </Grid>

          {/* Music Studio */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                border: "3px solid #000",
                borderRadius: "12px",
                boxShadow: "6px 6px #000",
                "&:hover": {
                  transform: "translate(2px, 2px)",
                  boxShadow: "4px 4px #000",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <MusicNote sx={{ fontSize: 40, color: "#9c27b0", mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Music Studio
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create AI-powered music with custom styles, keys, and tempo.
                </Typography>
                <Chip
                  label={hasProAccess ? "Unlocked" : "Pro/Premium"}
                  color={hasProAccess ? "success" : "warning"}
                  size="small"
                />
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Link href="/dashboard/music" passHref legacyBehavior>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<MusicNote />}
                    disabled={!hasProAccess}
                    sx={{
                      background:
                        "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
                      border: "2px solid #000",
                      boxShadow: "3px 3px #000",
                      "&:hover": {
                        transform: "translate(1px, 1px)",
                        boxShadow: "2px 2px #000",
                      },
                      "&:disabled": {
                        background: "#ccc",
                        color: "#666",
                      },
                    }}
                  >
                    Open Studio
                  </Button>
                </Link>
              </CardActions>
            </Card>
          </Grid>

          {/* Settings */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: "3px solid #000",
                borderRadius: "12px",
                boxShadow: "6px 6px #000",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Settings sx={{ fontSize: 40, color: "#ff9800", mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Account Settings
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Manage your profile, subscription, and preferences.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Link href="/dashboard/settings" passHref legacyBehavior>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Settings />}
                    sx={{
                      borderColor: "#000",
                      borderWidth: "2px",
                      "&:hover": {
                        borderWidth: "2px",
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    Settings
                  </Button>
                </Link>
              </CardActions>
            </Card>
          </Grid>

          {/* Upgrade CTA (if free tier) */}
          {!hasProAccess && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  border: "3px solid #000",
                  borderRadius: "12px",
                  boxShadow: "6px 6px #000",
                  background:
                    "linear-gradient(135deg, #ffd700 0%, #ffab00 100%)",
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    🚀 Upgrade to Pro
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Unlock Health Coach and Music Studio features.
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    $9/month
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Link href="/pricing" passHref legacyBehavior>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        background: "#000",
                        color: "#fff",
                        border: "2px solid #000",
                        "&:hover": {
                          background: "#333",
                        },
                      }}
                    >
                      View Pricing
                    </Button>
                  </Link>
                </CardActions>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
