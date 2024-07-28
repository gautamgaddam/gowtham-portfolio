import { Box } from "@mui/material";
import styles from "../styles/about.module.css";
import MusicPlayer from "./comps/MusicPlayer";
import { useEffect, useRef, useState } from "react";

const About = () => {
  const divRef = useRef(null);
  const [position, setPosition] = useState(0);

  const updatePosition = () => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();
      // console.log("rect", rect);
      setPosition(rect.y);
    }
  };
  useEffect(() => {
    updatePosition(); // Update position on mount

    window.addEventListener("scroll", updatePosition); // Update position on scroll
    window.addEventListener("resize", updatePosition); // Update position on resize

    return () => {
      window.removeEventListener("scroll", updatePosition); // Clean up
      window.removeEventListener("resize", updatePosition); // Clean up
    };
  }, []);
  // console.log("position===>", position);
  return (
    <Box className={styles.about} id="about">
      <Box className={styles.aboutContent}>
        <Box className={styles.aboutContentText}>
          <Box className="header">
            <h1 className="logo_and_name">
              {/* <Logo /> */}
              Gowtham Gaddam
            </h1>
            {/* <p>Call Me (+91) 7989692571</p>
            <p>gowtham09234@gmail.com</p> */}
          </Box>

          <p>
            I am a
            <span className={styles.aboutTitle}>
              Software Engineer/Freelancer
            </span>
            based in Bengaluru, India with solid expertise in building complex
            web applications with cutting edge technologies. Feel free to say
            hi.
          </p>

          {/* <div id="musicPlayer" ref={divRef}>
            <MusicPlayer />
          </div> */}
        </Box>
        <Box className={styles.aboutContentPicture}></Box>
      </Box>
    </Box>
  );
};

export default About;
