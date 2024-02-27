import Footer from "./Footer";
import Navbar from "./Navbar";
import { Container } from "@mui/material";
import BackgroundDark from "../images/darthvader2.png";
import BackgroundLight from "../images/millenniumfalcon.jpeg";
import { useTheme } from "@mui/material/styles";

const Layout = ({ children }) => {
  const theme = useTheme();
  return (
    <div
      className="content"
      // style={{
      //   backgroundImage: `url(${
      //     theme.palette.mode === "dark"
      //       ? BackgroundDark.src
      //       : BackgroundLight.src
      //   })`,
      // }}
    >
      <Navbar />
      <Container style={{ padding: "0px" }}>{children}</Container>
      <Footer />
    </div>
  );
};

export default Layout;
