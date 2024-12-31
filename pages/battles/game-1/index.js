import React, { useEffect, useRef, useState } from "react";
import gsap, { Power3 } from "gsap";
import {
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  IconButton,
} from "@mui/material";
import { useRouter } from "next/router";
import Slide from "@mui/material/Slide";
import { CloseSharp } from "@mui/icons-material";
import Tetris from "../../comps/Tetris";
import styles from "../../../styles/battles.module.css";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Game1 = () => {
  const circlesRef = useRef([]);
  const projectsRef = useRef([]);
  const [open, setOpen] = useState(false);
  const handleClickOpen = (color) => {
    if (color?.title === "Tetris") {
      setOpen(true);
    }
    if (color?.title === "TradeSense") {
      const url = "";
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    } else if (color?.title === "Gita Bot") {
      const url = color.link;
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const colors = [
    { name: "pink", title: "Sopra Steria" },
    { name: "red", title: "Airbus" },
    { name: "white", title: "BiscuitData" },

    { name: "green", title: "FalconAvl" },
    { name: "yellow", title: "InterviewBuddy" },
    { name: "purple", title: "Ulta Beauty" },
    { name: "teal", title: "Walmart" },
    { name: "blue", title: "Verizon" },
    { name: "orange", title: "Ebay" },
  ];

  const projects = [
    { name: "project1", title: "Tetris", link: "Tetris" },
    {
      name: "project2",
      title: "TradeSense",
      link: "https://tradesense.streamlit.app/",
    },
    { name: "project3", title: "Gita Bot", link: "https://x.com/uworstfellow" },
    { name: "project4", title: "Price Finder", link: "Price Finder" },
  ];
  useEffect(() => {
    circlesRef.current.forEach((circle, index) => {
      gsap.from(circle, {
        duration: 0.5,
        opacity: 1,
        y: 40,
        ease: Power3.easeOut,
        ...(index > 0 && { delay: index / 10 + 0.01 }), // delay based on index
      });
    });
    projectsRef.current.forEach((project, index) => {
      gsap.from(project, {
        duration: 0.5,
        opacity: 1,
        y: 40,
        ease: Power3.easeOut,
        ...(index > 0 && { delay: index / 10 + 0.01 }), // delay based on index
      });
    });
  }, []);
  // const openProject = (project) => {
  //   router.push("tetris");
  // };
  return (
    <>
      <Typography
        variant="h1"
        align="left"
        gutterBottom
        className={styles.formTitle}
      >
        Projects
      </Typography>
      <Typography
        variant="h4"
        align="left"
        gutterBottom
        className={styles.formSubTitle}
      >
        Personal
      </Typography>
      <div className={styles.circleContainer}>
        {projects.map((color, index) => (
          <Tooltip title={color.title} key={index}>
            <div
              style={{
                cursor:
                  index === 0 || index === 1 || index === 2
                    ? "pointer"
                    : "default",
              }}
              key={index}
              ref={(el) => {
                projectsRef.current[index] = el;
              }}
              className={`${styles.circle} ${styles[color.name]}`}
              onClick={() => handleClickOpen(color)}
            />
          </Tooltip>
        ))}
      </div>
      <Typography
        variant="h4"
        align="left"
        gutterBottom
        className={styles.formSubTitle}
      >
        Corporate
      </Typography>
      <div className={styles.circleContainer}>
        {colors.map((color, index) => (
          <Tooltip title={color.title}>
            <div
              key={index}
              ref={(el) => {
                circlesRef.current[index] = el;
              }}
              className={`${styles.circle} ${styles[color.name]}`}
            />
          </Tooltip>
        ))}
      </div>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle className={styles.dialogHeader}>
          Tetris
          <IconButton onClick={() => handleClose()}>
            <CloseSharp />
          </IconButton>
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          {open && <Tetris />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Game1;
