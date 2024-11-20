import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
} from "@mui/material";
import styles from "../styles/about.module.css";
import { useEffect, useRef, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";

const About = () => {
  const divRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [openDialog, setOpenDialog] = useState(false); // State to manage the dialog

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
  // Location link https://maps.app.goo.gl/aXt7ww2zR8ReSLkg7
  return (
    <Box className={styles.about} id="about">
      <Box className={styles.aboutContent}>
        <Box className={styles.aboutContentText}>
          <Box className="header">
            <h1 className="logo_and_name">
              Gowtham Gaddam
              <InfoIcon
                onClick={openInformation}
                style={{ cursor: "pointer", marginLeft: "8px" }}
              />
            </h1>
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
        </Box>
        <Box className={styles.aboutContentPicture}></Box>
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
          {/* <Typography variant="body2" color="textSecondary">
            Monthly Rates: 2,25,000/- INR
          </Typography> */}
          <Divider className={styles.aboutFreelanceRates} />
          <Typography
            variant="body2"
            color="textSecondary"
            className={styles.aboutRatesText}
          >
            MIGA: If you have an idea which fixes <strong>INDIA's</strong>{" "}
            problems like traffic, pollution etc and restore the{" "}
            <strong>culture</strong> of India, hit me up we can collaborate i
            will do it for free .✌️
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
