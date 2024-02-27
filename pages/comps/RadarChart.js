import React from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const SkillRadarChart = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return <div>No skills data available.</div>;
  }

  const categories = skills
    .map((skill) => skill.skills.map((x) => x.name))
    .flat();
  const data = {
    labels: categories,
    datasets: [
      {
        label: "Skill Level",
        data: skills.map((skill) => skill.skills.map((x) => x.value)).flat(),
        backgroundColor: "#ffffff1a",
        borderColor: "#ffffff",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        pointLabels: {
          color: "#fff",
          fontSize: "1rem",
        },
        grid: {
          color: [
            "#ffffff1a",
            // "red",
            // "orange",
            // "yellow",
            // "green",
            // "blue",
            // "indigo",
          ],
        },
        angleLines: {
          color: ["#ffffff1a"],
        },
      },
    },
  };

  console.log(data);
  return (
    <div>
      <Radar data={data} options={options} />
    </div>
  );
};

export default SkillRadarChart;
