import { useEffect } from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Typography } from "@mui/material";
import { createSupabaseClient } from "../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createSupabaseClient();

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/auth/login?error=callback_failed");
          return;
        }

        if (data.session) {
          // Successful authentication, redirect to dashboard
          router.push("/dashboard");
        } else {
          // No session, redirect to login
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        router.push("/auth/login?error=unexpected");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">Completing authentication...</Typography>
    </Box>
  );
}
