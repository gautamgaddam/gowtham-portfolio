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
import Snake from "../../comps/Snake";
import SpaceInvaders from "../../comps/SpaceInvaders";
import Breakout from "../../comps/Breakout";
import Game2048 from "../../comps/Game2048";
import Pong from "../../comps/Pong";
import styles from "../../../styles/battles.module.css";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Game1 = () => {
  const circlesRef = useRef([]);
  const projectsRef = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const router = useRouter();
  const handleClickOpen = (color) => {
    if (color?.title === "Tetris") {
      setOpen(true);
      setActiveGame("Tetris");
    } else if (color?.title === "Snake") {
      setOpen(true);
      setActiveGame("Snake");
    } else if (color?.title === "Space Invaders") {
      setOpen(true);
      setActiveGame("Space Invaders");
    } else if (color?.title === "Breakout") {
      setOpen(true);
      setActiveGame("Breakout");
    } else if (color?.title === "2048") {
      setOpen(true);
      setActiveGame("2048");
    } else if (color?.title === "Pong") {
      setOpen(true);
      setActiveGame("Pong");
    } else if (color?.title === "Health Chatbot") {
      router.push("/health");
    } else if (color?.title === "Music Studio") {
      router.push("/music-studio");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setActiveGame(null);
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
    { name: "project2", title: "Snake", link: "Snake" },
    { name: "project3", title: "Space Invaders", link: "Space Invaders" },
    { name: "project4", title: "Breakout", link: "Breakout" },
    { name: "project5", title: "2048", link: "2048" },
    { name: "project6", title: "Pong", link: "Pong" },
    { name: "project7", title: "Health Chatbot", link: "/health" },
    { name: "project8", title: "Music Studio", link: "/music-studio" },
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
                cursor: "pointer",
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
        style={{ display: "none" }}
      >
        Corporate
      </Typography>
      <div className={styles.circleContainer} style={{ display: "none" }}>
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
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            background: "linear-gradient(160deg, #0a0a1a 0%, #111128 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 0 60px rgba(0,212,255,0.08), 0 24px 64px rgba(0,0,0,0.7)",
            borderRadius: "14px",
            overflow: "hidden",
            height: "95vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          className={styles.dialogHeader}
          sx={{
            background: "transparent",
            color: "#e2e8f0",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "3px",
            fontSize: "13px",
            pb: 0,
          }}
        >
          {activeGame?.toUpperCase() || "GAME"}
          <IconButton
            onClick={() => handleClose()}
            sx={{ color: "#64748b", "&:hover": { color: "#e2e8f0" } }}
          >
            <CloseSharp fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          className={styles.dialogContent}
          sx={{
            p: 0,
            "&::-webkit-scrollbar": { display: "none" },
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {open && activeGame === "Tetris" && <Tetris />}
          {open && activeGame === "Snake" && <Snake />}
          {open && activeGame === "Space Invaders" && <SpaceInvaders />}
          {open && activeGame === "Breakout" && <Breakout />}
          {open && activeGame === "2048" && <Game2048 />}
          {open && activeGame === "Pong" && <Pong />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Game1;
