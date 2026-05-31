import {
  AppBar,
  Box,
  Container,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Dashboard,
  Person,
  Logout,
  Login,
  PersonAdd,
} from "@mui/icons-material";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, profile, signOut } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleUserMenuClose();
    await signOut();
  };

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{ textAlign: "center" }}
      className="mobileHeader"
    >
      <Link href="/" passHref>
        <Box sx={{ my: 2 }}>About</Box>
      </Link>
      <Link href="/#skills" passHref>
        <Box sx={{ my: 2 }}>Inventory</Box>
      </Link>
      <Link href="/battles" passHref>
        <Box sx={{ my: 2 }}>Battles</Box>
      </Link>
      <Link href="/pricing" passHref>
        <Box sx={{ my: 2 }}>Pricing</Box>
      </Link>
      {user ? (
        <>
          <Link href="/dashboard/health" passHref>
            <Box sx={{ my: 2 }}>Health</Box>
          </Link>
          <Link href="/dashboard/music" passHref>
            <Box sx={{ my: 2 }}>Studio</Box>
          </Link>
          <Link href="/dashboard" passHref>
            <Box sx={{ my: 2 }}>Dashboard</Box>
          </Link>
          <Box sx={{ my: 2, cursor: "pointer" }} onClick={handleSignOut}>
            Logout
          </Box>
        </>
      ) : (
        <>
          <Link href="/auth/login" passHref>
            <Box sx={{ my: 2 }}>Login</Box>
          </Link>
          <Link href="/auth/signup" passHref>
            <Box sx={{ my: 2 }}>Sign Up</Box>
          </Link>
        </>
      )}
    </Box>
  );

  return (
    <AppBar
      component="nav"
      position="sticky"
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#121212" : "#66bb6a",
      }}
    >
      <Container>
        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              className="buttonDrawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "block" } }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              className="mobileHeaderDrawer"
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
            >
              {drawer}
            </Drawer>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
            className="header"
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Link href="/">About</Link>
              <Link href="/#skills">Inventory</Link>
              <Link href="/battles">Battles</Link>
              {user && (
                <>
                  <Link href="/dashboard/health">Health</Link>
                  <Link href="/dashboard/music">Studio</Link>
                </>
              )}
              <Link href="/#contact">Contact</Link>
              <Link href="/pricing">Pricing</Link>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {user && profile ? (
                <>
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{
                      border: "2px solid #000",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "#fff",
                        color: "#000",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                      }}
                    >
                      {profile.full_name?.[0] || profile.username?.[0] || "U"}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                      sx: {
                        border: "3px solid #000",
                        borderRadius: "8px",
                        boxShadow: "4px 4px #000",
                        mt: 1,
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Box fontWeight="bold">
                        {profile.full_name || profile.username}
                      </Box>
                      <Box fontSize="0.85rem" color="text.secondary">
                        @{profile.username}
                      </Box>
                    </Box>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        handleUserMenuClose();
                        window.location.href = "/dashboard";
                      }}
                    >
                      <ListItemIcon>
                        <Dashboard fontSize="small" />
                      </ListItemIcon>
                      Dashboard
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleUserMenuClose();
                        window.location.href = `/u/${profile.username}`;
                      }}
                    >
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      View Portfolio
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSignOut}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      Sign Out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/auth/login"
                    startIcon={<Login />}
                    sx={{
                      color: "#fff",
                      border: "2px solid #fff",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "#fff",
                      },
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    href="/auth/signup"
                    startIcon={<PersonAdd />}
                    variant="contained"
                    sx={{
                      bgcolor: "#fff",
                      color: "#000",
                      border: "2px solid #000",
                      fontWeight: "bold",
                      "&:hover": {
                        bgcolor: "#f0f0f0",
                      },
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
        {/* </Toolbar> */}
      </Container>
    </AppBar>
  );
};

export default Navbar;
