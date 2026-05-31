import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { MusicNote } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import MusicStudio from "../comps/MusicStudio";

export default function DashboardMusic() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
        }}
      >
        <CircularProgress size={48} sx={{ color: "#ab47bc" }} />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  if (profile?.subscription_tier === "free") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              border: "4px solid #000",
              borderRadius: "12px",
              boxShadow: "8px 8px #000",
              backgroundColor:
                theme.palette.mode === "dark" ? "#1a1a1a" : "#ffffff",
              p: 5,
              textAlign: "center",
              maxWidth: 500,
              mx: "auto",
            }}
          >
            <MusicNote sx={{ fontSize: 72, color: "#ab47bc", mb: 2 }} />
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mb: 2, letterSpacing: "-0.5px" }}
            >
              Music Studio is a Pro Feature
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                color: theme.palette.mode === "dark" ? "#ccc" : "#444",
              }}
            >
              Generate AI-powered music with full composition analysis, Spotify
              artist inspiration, and downloadable tracks.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Link href="/pricing" passHref legacyBehavior>
                <Button
                  component="a"
                  variant="contained"
                  fullWidth
                  sx={{
                    border: "3px solid #000",
                    boxShadow: "4px 4px #000",
                    borderRadius: "8px",
                    fontWeight: 900,
                    fontSize: "1rem",
                    backgroundColor: "#ab47bc",
                    color: "#fff",
                    textTransform: "none",
                    py: 1.5,
                    "&:hover": {
                      backgroundColor: "#7b1fa2",
                      boxShadow: "2px 2px #000",
                      transform: "translate(2px, 2px)",
                    },
                  }}
                >
                  Upgrade to Pro — $9/month
                </Button>
              </Link>
              <Link href="/dashboard" passHref legacyBehavior>
                <Button
                  component="a"
                  variant="outlined"
                  fullWidth
                  sx={{
                    border: "3px solid #000",
                    boxShadow: "4px 4px #000",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    textTransform: "none",
                    py: 1.5,
                    "&:hover": {
                      boxShadow: "2px 2px #000",
                      transform: "translate(2px, 2px)",
                    },
                  }}
                >
                  Back to Dashboard
                </Button>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
      }}
    >
      <MusicStudio />
    </Box>
  );
}
