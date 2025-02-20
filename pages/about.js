import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";
import styles from "../styles/about.module.css";
import { useEffect, useRef, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import PlaceIcon from "@mui/icons-material/Place";
import GpsNotFixedIcon from "@mui/icons-material/GpsNotFixed";
const About = () => {
  const divRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [openDialog, setOpenDialog] = useState(false); // State to manage the dialog
  const [trackTime, setTrackTime] = useState(0);
  const updatePosition = () => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();
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

  const openInformation = () => {
    setOpenDialog(true); // Open the dialog
  };

  const closeInformation = () => {
    setOpenDialog(false); // Close the dialog
  };

  // Typing Animation Logic
  useEffect(() => {
    const element = document.getElementById("about_animated");
    const texts = [
      "Software Engineer 💻",
      "Freelancer 🌍",
      "Superjock 🏋️‍♂️",
      "Environmentalist 🌱",
      "Type 1 Diabetic 💉",
    ];
    let index = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      if (!element) return;
      const currentText = texts[index];
      setTrackTime(index);
      element.innerHTML = `${currentText.slice(
        0,
        charIndex
      )}<span class="cursor">|</span>`;

      // const currentText = texts[index];
      // element.textContent = currentText.slice(0, charIndex);

      if (!isDeleting && charIndex < currentText.length) {
        charIndex++;
        setTimeout(type, 25);
        // setTrackTime((prevTrackTime) => prevTrackTime + 50);
      } else if (isDeleting && charIndex > 0) {
        charIndex--;
        setTimeout(type, 50);
        // setTrackTime((prevTrackTime) => prevTrackTime + 100);
      } else {
        isDeleting = !isDeleting;
        if (!isDeleting) {
          index = (index + 1) % texts.length;
        }
        setTimeout(type, 500);
        // setTrackTime((prevTrackTime) => prevTrackTime + 100);
      }
    };

    type();
  }, []);
  // console.log(trackTime);
  return (
    <Box className={styles.about} id="about">
      <Box className={styles.aboutContent}>
        <Box className={styles.aboutContentText}>
          <Box className="header">
            <h1 className="logo_and_name">
              Gowtham Gaddam
              <InfoIcon
                onClick={openInformation}
                className={styles.infoIcon}
                style={{ cursor: "pointer", marginLeft: "8px" }}
              />
            </h1>
          </Box>

          <p>
            I am {trackTime === 3 ? "an" : "a"}
            <span className={styles.aboutTitle}>
              <span id="about_animated"></span>
            </span>
            <br />
            based in India with solid expertise in building complex web
            applications with cutting edge technologies. Feel free to say hi. 😊
          </p>
        </Box>
        <Box className={styles.aboutContentPicture}>
          <a
            href="https://www.google.com/maps/place/Inam+Dattathreya+Peeta,+Karnataka/@13.416025,75.745685,14z/data=!3m1!4b1!4m6!3m5!1s0x3bbadf33ca5f7193:0x96e0bf36243f180!8m2!3d13.4171769!4d75.7429636!16s%2Fg%2F11vj7j0q0?entry=ttu&g_ep=EgoyMDI0MTEyNC4xIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.aboutPlaceIcon}>
              <GpsNotFixedIcon />
            </span>
          </a>
        </Box>
      </Box>

      {/* Dialog Component */}
      <Dialog
        PaperProps={{
          style: {
            backgroundColor: "#000000db",
            boxShadow: "none",
          },
        }}
        open={openDialog}
        onClose={closeInformation}
        aria-labelledby="info-dialog-title"
      >
        <DialogTitle id="info-dialog-title">
          About Freelance Rates and Shenanigans
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Hello! I am Gowtham Gaddam, a software engineer and freelancer from
            India. Below are my rates for freelance work.
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            className={styles.aboutRatesText}
          >
            Hourly Rates: <strong>20$-60$ </strong>(negotiable and depends on
            the requirement).
          </Typography>
          <Divider className={styles.aboutFreelanceRates} />
          <Typography
            variant="body2"
            color="textSecondary"
            className={styles.aboutRatesText}
          >
            MIGA: If you have an idea which fixes <strong>INDIA's</strong>{" "}
            problems like traffic, pollution etc using tech! and restore the{" "}
            <strong>
              <u>
                {" "}
                <a href="https://en.wikipedia.org/wiki/Rigveda" target="_blank">
                  culture
                </a>
              </u>
            </strong>{" "}
            of India , hit me up we can collaborate.✌️
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeInformation}
            color="primary"
            className={styles.aboutCloseButton}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default About;
