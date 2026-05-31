import React from "react";
import { Box, BottomNavigationAction, Container } from "@mui/material";
import {
  HomeOutlined,
  SportsScore,
  LinkedIn,
  Twitter,
  GitHub,
  Spa,
  MusicNote,
  Star,
} from "@mui/icons-material";
import Link from "next/link";
import XIcon from "@mui/icons-material/X";
const Footer = () => {
  const allLinks = [
    {
      route: "/",
      name: "Home",
      icon: <HomeOutlined />,
      id: 0,
    },
    {
      route: "https://www.linkedin.com/in/gowtham-gaddam/",
      name: "LinkedIn",
      icon: <LinkedIn />,
      id: 1,
      isExternal: true,
    },
    {
      route: "https://x.com/gautamgaddam",
      name: "X",
      icon: <XIcon />,
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
    {
      route: "/health",
      name: "Health",
      icon: <Spa />,
      id: 4,
    },
    {
      route: "/music-studio",
      name: "Studio",
      icon: <MusicNote />,
      id: 5,
    },
    {
      route: "/pricing",
      name: "Pricing",
      icon: <Star />,
      id: 6,
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
