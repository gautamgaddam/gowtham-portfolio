import styles from "../../../styles/battles.module.css";
import { useEffect, useRef } from "react";
import gsap, { Power3 } from "gsap";
import { Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/router";
const Game1 = () => {
  const router = useRouter();
  const circlesRef = useRef([]);
  const projectsRef = useRef([]);
  const colors = [
    { name: "pink", title: "Sopra Steria" },
    { name: "red", title: "Airbus" },
    { name: "blue", title: "Verizon" },
    { name: "orange", title: "Ebay" },
    { name: "green", title: "FalconAvl" },
    { name: "yellow", title: "InterviewBuddy" },
    { name: "purple", title: "Ulta Beauty" },
    { name: "teal", title: "Walmart" },
  ];

  const projects = [
    { name: "project1", title: "Tetris", link: "Tetris" },
    {
      name: "project2",
      title: "TradeSense",
      link: "https://tradesense.streamlit.app/",
    },
    { name: "project3", title: "Gita Bot", link: "Gita Bot" },
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
        Projects()
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
          <Tooltip title={color.title}>
            <div
              key={index}
              ref={(el) => {
                projectsRef.current[index] = el;
              }}
              className={`${styles.circle} ${styles[color.name]}`}
              // onClick={() => openProject(color)}
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
    </>
  );
};

export default Game1;
