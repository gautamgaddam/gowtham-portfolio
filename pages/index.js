import About from "./about";

import Skills from "./skills";
import ContactUs from "./contact";
import { useMediaQuery, useTheme } from "@mui/material";
export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Adjusts based on the theme's breakpoints for 'sm'

  return (
    <>
      <About />
      <Skills />
      {!isMobile && <ContactUs />}
    </>
  );
}
