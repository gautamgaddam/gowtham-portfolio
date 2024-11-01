import React from "react";
import { Box, BottomNavigationAction, Container } from "@mui/material";
import {
  HomeOutlined,
  SportsScore,
  LinkedIn,
  Twitter,
  GitHub,
} from "@mui/icons-material";
import Link from "next/link";

const Footer = () => {
  const allLinks = [
    {
      route: "/",
      name: "Home",
      icon: <HomeOutlined />,
      id: 0,
    },
    {
      route: "https://www.linkedin.com/in/gowtham-kumar-g-92b757119/",
      name: "LinkedIn",
      icon: <LinkedIn />,
      id: 1,
      isExternal: true,
    },
    {
      route: "https://x.com/gautamgaddam",
      name: "Twitter",
      icon: <Twitter />,
      id: 2,
      isExternal: true,
    },
    // {
    //   route: "https://github.com/gautamgaddam",
    //   name: "Github",
    //   icon: <GitHub />,
    //   id: 2,
    //   isExternal: true,
    // },
    {
      route: "/battles",
      name: "Battles",
      icon: <SportsScore />,
      id: 3,
    },
  ];

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container className="footer-container">
      <footer>
        <Box display="flex" justifyContent="space-between" width="100%">
          {allLinks.map((link) => (
            <Link
              href={link.route}
              className={link.name}
              key={link.route}
              {...(link.isExternal && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
            >
              <BottomNavigationAction
                label={link.name}
                icon={link.icon}
                component="p"
              />
            </Link>
          ))}
        </Box>
      </footer>
    </Container>
  );
};

export default Footer;
