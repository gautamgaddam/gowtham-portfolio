import React from "react";
import { Box } from "@mui/material";
import styles from "../styles/about.module.css";
import SkillRadarChart from "./comps/RadarChart";
// import Tetris from "./comps/Tetris";

const Skills = () => {
  const expandedSkills = [
    {
      category: "Frontend and JavaScript Frameworks/Libraries",
      skills: [
        { name: "Javascript", value: 8 },
        { name: "ReactJs", value: 8 },
        { name: "Redux", value: 8 },
        { name: "NodeJs", value: 8 },
        { name: "GraphQl", value: 5 },
        { name: "MarkoJs", value: 6 },
        { name: "AngularJs", value: 4 },
        { name: "KnockoutJs", value: 7 },
        { name: "TypeScript", value: 7 },
        { name: "Next.js", value: 7 },
        { name: "React Native", value: 6 },
      ],
    },
    {
      category: "Web Development Technologies",
      skills: [
        { name: "Html", value: 8 },
        { name: "Css", value: 8.5 },
        { name: "Scss", value: 8 },
        { name: "Sass", value: 7 },
        { name: "Css Grid", value: 7 },
        { name: "Css Flexbox", value: 8 },
        { name: "Tailwind Css", value: 8 },
        { name: "Ant Design", value: 8 },
        { name: "Material UI", value: 8 },
        { name: "React Canva", value: 5 },
        { name: "Airbus Design System", value: 8 },
      ],
    },
    {
      category: "Database Technologies",
      skills: [
        { name: "Mysql", value: 7 },
        { name: "Postgresql", value: 8 },
        { name: "MongoDb", value: 6 },
        { name: "Firebase", value: 7 },
        { name: "Redis", value: 6 },
        { name: "SQLite", value: 7 },
        { name: "Knex ORM", value: 7 },
        { name: "Type ORM", value: 7 },
      ],
    },
    {
      category: "Cloud Platforms",
      skills: [
        { name: "Amazon Web Services", value: 8 },
        { name: "Google Cloud Platform", value: 8 },
        { name: "Azure", value: 6 },
        { name: "CI/CD: Jenkins", value: 8 },
      ],
    },
    {
      category: "General Programming Concepts and Tools",
      skills: [
        { name: "Git and Version Control", value: 9 },
        { name: "Jest Testing Framework", value: 8 },
        { name: "Sinon", value: 7 },
        { name: "React Testing Library", value: 8 },
      ],
    },
  ];

  return (
    <Box className={styles.skills} id="skills">
      <Box className={styles.skillsContent}>
        <Box className={styles.skillsContentText}>
          <h1 className={styles.skillsTitle}>Guns()</h1>
          {/* <Stack */}
          {/* // direction="row"
            className={styles.skillsStack}
            divider={<Divider orientation="vertical" flexItem />}
            spacing={2}
          > */}
          {/* {expandedSkills[0][0].map((skill, i) => {
              return <Item key={i}>{skill}</Item>;
            })}
            {mySkills[1][1].map((skill, i) => {
              return <Item key={i}>{skill}</Item>;
            })}
            {mySkills[2][2].map((skill, i) => {
              return <Item key={i}>{skill}</Item>;
            })}
            {mySkills[3][3].map((skill, i) => {
              return <Item key={i}>{skill}</Item>;
            })} */}

          {/* {expandedSkills.map((skill, i) => {
              return (
                <React.Fragment key={i}>
                  {" "}
                  <h4>{skill.category}</h4>
                  <ul>
                    {skill.skills.map((eachSkill, j) => {
                      return <li key={j}>{eachSkill}</li>;
                    })}
                  </ul>
                </React.Fragment>
              );
            })} */}

          {/* </Stack> */}
          <SkillRadarChart skills={expandedSkills} />
          {/* <Tetris /> */}
        </Box>
      </Box>
    </Box>
  );
};

export default Skills;
