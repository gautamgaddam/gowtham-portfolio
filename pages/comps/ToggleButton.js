import { useContext } from "react";
import ColorModeContext from "../../styles/ColorModeContext";
import { useTheme } from "@mui/material/styles";

import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const LightSaber = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="32"
      height="32"
      viewBox="0,0,256,256"
      style="fill:#000000;"
    >
      <g transform="translate(40,40) scale(0.6875,0.6875)">
        <g
          fill="#000000"
          fill-rule="nonzero"
          stroke="none"
          stroke-width="1"
          stroke-linecap="butt"
          stroke-linejoin="miter"
          stroke-miterlimit="10"
          stroke-dasharray=""
          stroke-dashoffset="0"
          font-family="none"
          font-weight="none"
          font-size="none"
          text-anchor="none"
          style="mix-blend-mode: normal"
        >
          <g transform="translate(-46.44669,134.01041) rotate(-45) scale(8,8)">
            <path d="M28.5,2c-0.38281,0 -0.76562,0.14453 -1.0625,0.4375l-15.4375,15.44141v4.24219l17.5625,-17.55859c0.58203,-0.58984 0.58203,-1.53516 0,-2.125c-0.29687,-0.29297 -0.67969,-0.4375 -1.0625,-0.4375zM11,18l-3,3l-0.79297,-0.79297l-1.5,1.5l0.79297,0.79297l-4.5,4.5l3,3l6,-6z"></path>
          </g>
        </g>
      </g>
    </svg>
  );
};

const ToggleButton = () => {
  const theme = useTheme();
  const { darkMode, setDarkMode } = useContext(ColorModeContext);
  // console.log(darkMode);
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "end",
      }}
    >
      <Tooltip
        title={`${
          theme.palette.mode.charAt(0).toUpperCase() +
          theme.palette.mode.slice(1)
        } mode`}
      >
        <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
          {theme.palette.mode === "dark" ? (
            <Brightness7Icon />
          ) : (
            <Brightness4Icon />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ToggleButton;
