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
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

export default function Signup() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }

    // Username validation (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { data, error } = await signUp(
      formData.email,
      formData.password,
      formData.username,
      formData.fullName,
    );

    if (error) {
      setError(error.message || "Failed to sign up");
      setLoading(false);
    } else {
      // Show success message
      alert(
        "Account created successfully! Please check your email to verify your account.",
      );
      router.push("/auth/login");
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
            <PersonAdd sx={{ fontSize: 60, color: "#66bb6a", mb: 2 }} />
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join PortfolioFlow and build your presence
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
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
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
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              helperText="This will be your unique URL: /u/username"
              sx={{
                "& .MuiOutlinedInput-root": {
                  border: "2px solid #000",
                },
              }}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
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

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
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
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{" "}
                <Link href="/auth/login" passHref legacyBehavior>
                  <MuiLink
                    sx={{
                      color: "#66bb6a",
                      fontWeight: "bold",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Sign In
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
