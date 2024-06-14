import styles from "../../../styles/battles.module.css";
import { useEffect, useRef } from "react";
import gsap, { Power3 } from "gsap";
import { Typography } from "@mui/material";

const Game1 = () => {
  const circlesRef = useRef([]);
  const projectsRef = useRef([]);
  const colors = [
    "pink",
    "red",
    "blue",
    "orange",
    "green",
    "yellow",
    "purple",
    "teal",
  ];
  const projects = ["project1", "project2", "project3", "project4"];
  useEffect(() => {
    circlesRef.current.forEach((circle, index) => {
      console.log({ x: index, ...(index > 0 && { delay: index / 10 + 0.01 }) });
      gsap.from(circle, {
        duration: 1,
        opacity: 1,
        y: 40,
        ease: Power3.easeOut,
        ...(index > 0 && { delay: index / 10 + 0.01 }), // delay based on index
      });
    });
    projectsRef.current.forEach((project, index) => {
      console.log({ x: index, ...(index > 0 && { delay: index / 10 + 0.01 }) });
      gsap.from(project, {
        duration: 1,
        opacity: 1,
        y: 40,
        ease: Power3.easeOut,
        ...(index > 0 && { delay: index / 10 + 0.01 }), // delay based on index
      });
    });
  }, []);

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
          <div
            key={index}
            ref={(el) => {
              projectsRef.current[index] = el;
            }}
            className={`${styles.circle} ${styles[color]}`}
          />
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
          <div
            key={index}
            ref={(el) => {
              circlesRef.current[index] = el;
            }}
            className={`${styles.circle} ${styles[color]}`}
          />
        ))}
      </div>
    </>
  );
};

export default Game1;
