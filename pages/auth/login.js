import { useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Link as MuiLink,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

export default function Login() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await signIn(email, password);

    if (error) {
      setError(error.message || "Failed to sign in");
      setLoading(false);
    } else {
      // Redirect to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            : "linear-gradient(135deg, #66bb6a 0%, #43a047 100%)",
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            border: "4px solid #000",
            borderRadius: "12px",
            boxShadow: "8px 8px #000",
            backgroundColor: theme.palette.mode === "dark" ? "#1a1a1a" : "#fff",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <LoginIcon sx={{ fontSize: 60, color: "#66bb6a", mb: 2 }} />
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to access your dashboard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, border: "2px solid #000" }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  border: "2px solid #000",
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  border: "2px solid #000",
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #66bb6a 0%, #43a047 100%)",
                border: "3px solid #000",
                borderRadius: "8px",
                boxShadow: "4px 4px #000",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #43a047 0%, #2e7d32 100%)",
                  transform: "translate(2px, 2px)",
                  boxShadow: "2px 2px #000",
                },
                "&:disabled": {
                  background: "#ccc",
                  color: "#666",
                },
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2">
                Don't have an account?{" "}
                <Link href="/auth/signup" passHref legacyBehavior>
                  <MuiLink
                    sx={{
                      color: "#66bb6a",
                      fontWeight: "bold",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Sign Up
                  </MuiLink>
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
