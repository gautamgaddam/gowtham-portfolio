import { Box, AppBar, Container } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ToggleButton from "./ToggleButton";
import Link from "next/link";
const Navbar = () => {
  const theme = useTheme();
  return (
    <AppBar
      component={"nav"}
      className="nav"
      position="sticky"
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#000" : "#66bb6a",
      }}
    >
      <Container>
        {/* <Box className="header">
          <h1 className="logo_and_name">
            <Logo />
            <TerminalTwoToneIcon fontSize="10px" /> Gowtham Gaddam
          </h1>
          <p>Call Me (+91) 7989692571</p>
          <p>gowtham09234@gmail.com</p>
        </Box> */}
        <Box className="header">
          <Link href="/#about"> About</Link>
          <Link href="/#skills">Guns</Link>
          <Link href="/battles">Battles</Link>
          <Link href="/#contact">Contact</Link>
        </Box>

        <Box className="toggleButton">
          <ToggleButton />
        </Box>
      </Container>
    </AppBar>
  );
};

export default Navbar;
