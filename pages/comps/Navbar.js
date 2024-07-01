import {
  AppBar,
  Box,
  Container,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
      <Link href="/#contact" passHref>
        <Box sx={{ my: 2 }}>Contact</Box>
      </Link>
      <Link href="../resume/17_06_2024.pdf" passHref>
        <Box sx={{ my: 2 }} target="_blank" rel="noopener noreferrer">
          Resume
        </Box>
      </Link>
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
              width: "100%",
            }}
            className="header"
          >
            <Link href="/">About</Link>
            <Link href="/#skills">Inventory</Link>
            <Link href="/battles">Battles</Link>
            <Link href="/#contact">Contact</Link>
            {/* <Link
              href="../resume/01_07_2024.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume
            </Link> */}
          </Box>
        )}
        {/* </Toolbar> */}
      </Container>
    </AppBar>
  );
};

export default Navbar;
