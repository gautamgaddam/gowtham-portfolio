import styles from "../../../styles/battles.module.css";
import { useEffect, useRef } from "react";
import gsap, { Power3 } from "gsap";
import { useGSAP } from "@gsap/react";
const Game1 = () => {
  let circlePink = useRef(null);
  let circleRed = useRef(null);
  let circleBlue = useRef(null);
  useEffect(() => {
    // console.log(circleBlue, circlePink, circleRed);
    // gsap.to(circlePink.current, { opacity: 0.6 });
    // gsap.to(circleRed.current, { opacity: 0.6 });
    // gsap.to(circleBlue.current, { opacity: 0.6 });
    gsap.from(circlePink.current, {
      duration: 0.8,
      opacity: 1,
      x: 40,
      ease: Power3.easeOut,
    });

    gsap.from(circleRed.current, {
      duration: 0.8,
      opacity: 1,
      x: 40,
      ease: Power3.easeOut,
      delay: 0.2,
    });
    gsap.from(circleBlue.current, {
      duration: 0.8,
      opacitx: 1,
      x: 40,
      ease: Power3.easeOut,
      delay: 0.4,
    });
  }, []);

  // useGSAP(
  //   () => {
  //     // use selectors...

  //     // or refs...
  //     gsap.to(circle.current, { rotation: "-=360" });
  //   },
  //   { scope: circlePink }
  // );
  return (
    <div className={styles.circleContainer}>
      <div ref={circlePink} className={styles.circle}></div>
      <div ref={circleRed} className={styles.circle + " " + "red"}></div>
      <div ref={circleBlue} className={styles.circle + " " + "blue"}></div>
    </div>
  );
};
export default Game1;
