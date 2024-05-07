import React from "react";

import styles from "../../styles/vinyl.module.css";

const RotatingVinyl = () => (
  <div className={styles.wrap}>
    <div className={styles.album}>
      <div className={styles.cover}>
        <div className={styles.print}></div>
      </div>
      <div className={styles.vinyl}>
        <div className={styles.print}></div>
      </div>
    </div>
  </div>
);
export default RotatingVinyl;
 