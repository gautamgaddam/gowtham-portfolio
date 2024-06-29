import React from "react";
import { Box, BottomNavigationAction, Container } from "@mui/material";
import { HomeOutlined, SportsScore } from "@mui/icons-material";
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
    { route: "/tetris", name: "Battles", icon: <HomeOutlined />, id: 3 },
  ];
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container className="footer-container">
      <footer>
        <Box display="flex" justifyContent={"space-between"} width="100%">
          {allLinks.map((link) => {
            if (link.id === 1 || link.id === 3) {
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
