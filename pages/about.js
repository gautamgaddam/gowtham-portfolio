import { Box } from "@mui/material";
import styles from "../styles/about.module.css";
import MusicPlayer from "./comps/MusicPlayer";

const About = () => {
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

          <MusicPlayer />
        </Box>
        <Box className={styles.aboutContentPicture}></Box>
      </Box>
    </Box>
  );
};

export default About;
