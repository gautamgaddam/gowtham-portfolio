import React from "react";
import {
  Box,
  Stack,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import styles from "../styles/about.module.css";
import SkillRadarChart from "./comps/RadarChart";

const Skills = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Adjusts based on the theme's breakpoints for 'sm'

  const expandedSkills = [
    {
      category: "JavaScript Frameworks/Libraries",
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
      category: "Backend Technologies",
      skills: [{ name: "Python", value: 5 }],
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
        { name: "StoryBook UI", value: 8 },
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
        { name: "DynamoDb", value: 6 },
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

  const getColor = (value) => {
    return "orange";
  };

  const getWidth = (value) => `${(value / 10) * 100}%`;

  return (
    <Box className={styles.skills} id="skills">
      <Box className={styles.skillsContent}>
        <Box className={styles.skillsContentText}>
          <h1 className={styles.skillsTitle}>Inventory()</h1>
          {isMobile ? (
            <Stack
              // direction="row"
              className={styles.skillsStack}
              divider={<Divider orientation="vertical" flexItem />}
              spacing={2}
            >
              {expandedSkills.slice(0, 2).map((skill, i) => (
                <React.Fragment key={i}>
                  <Typography variant="h6">{skill.category}</Typography>
                  <ul style={{ padding: "0px" }}>
                    {skill.skills.map((eachSkill, j) => (
                      <li key={j} className={styles.skillItem}>
                        <Box sx={{ width: "100%", backgroundColor: "#3f311c" }}>
                          <Box
                            sx={{
                              height: "100%",
                              width: getWidth(eachSkill.value),
                              backgroundColor: getColor(eachSkill.value),
                              transition: "width 0.5s ease-in-out",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",

                              color: "#000",
                            }}
                          >
                            <Typography
                              variant="body1"
                              className={styles.skillName}
                            >
                              {eachSkill.name}
                            </Typography>
                            {/* <Typography variant="body1">
                              {/* SCORE: {eachSkill.value} */}
                            {/* </Typography> */}
                          </Box>
                        </Box>
                      </li>
                    ))}
                  </ul>
                </React.Fragment>
              ))}
            </Stack>
          ) : (
            <SkillRadarChart skills={expandedSkills} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Skills;
