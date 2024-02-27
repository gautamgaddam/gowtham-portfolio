import React from "react";
import {
  BottomNavigation,
  Box,
  BottomNavigationAction,
  Paper,
  Container,
} from "@mui/material";
import {
  Restore as RestoreIcon,
  HomeOutlined,
  SportsScore,
} from "@mui/icons-material";
import RocketIcon from "@mui/icons-material/Rocket";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();
  const allLinks = [
    { route: "/", name: "Home", icon: <HomeOutlined />, id: 0 },
    // { route: "/about", name: "About" },
    // { route: "/ninjas", name: "Ninja Listing" },
    {
      route: "/icon",
      name: "rocket",
      icon: (
        <RocketIcon
          className="race_icon"
          style={{ transform: "rotate(90deg)" }}
        />
      ),
      id: 1,
    },
    { route: "/battles", name: "Battles", icon: <SportsScore />, id: 2 },
  ];
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    // <Paper
    //   // sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
    //   elevation={3}
    // >
    //   {" "}
    //   <BottomNavigation value={value} onChange={handleChange}>
    //     <Container>

    //     </Container>
    //   </BottomNavigation>
    // </Paper>
    <Container className="footer-container">
      <footer>
        <Box display="flex" justifyContent={"space-between"} width="100%">
          {allLinks.map((link) => {
            if (link.id === 1) {
              return <React.Fragment key={link.id}></React.Fragment>;
              // return <canvas id="race_icon" key={link.id}></canvas>;
            }
            return (
              <Link
                href={link.route}
                className={link.name}
                key={link.route}
                passHref
              >
                <BottomNavigationAction
                  key={link.route}
                  label={link.name}
                  icon={link.icon}
                  component={"p"}
                />
              </Link>
            );
          })}
        </Box>
      </footer>
    </Container>
  );
};

export default Footer;
