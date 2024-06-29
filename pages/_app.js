import * as React from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from "@emotion/react";
import theme from "../styles/theme";
import createEmotionCache from "../styles/createEmotionCache";
import Layout from "./comps/Layout";
import { useState, useEffect } from "react";
import { CircularProgress, LinearProgress, useMediaQuery } from "@mui/material";
import darkTheme from "../styles/darkTheme";
import ColorModeContext from "../styles/ColorModeContext";
import "../styles/globals.css";
import FavIcon from "../public/favicon_io/favicon-32x32.png";
import { useRouter } from "next/router";
// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  // Set dark mode based on media query
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [loading, setLoading] = useState(true);
  console.log("router", router.pathname);
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);
  useEffect(() => {
    const mode = localStorage.getItem("mode") === "true";
    // set mode
    // console.log(`get localStore ${mode}`);
    setDarkMode(mode);
  }, []);

  // useEffect(() => {
  //   console.log(`set localStore ${darkMode}`);
  //   localStorage.setItem("mode", darkMode);
  // }, [darkMode]);
  const _setDarkMode = (newmode) => {
    // console.log(`set localStore ${newmode}`);
    localStorage.setItem("mode", newmode);
    setDarkMode(newmode);
  };
  // console.log("darkMode", darkMode);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>Gowtham Gaddam</title>
        <link rel="icon" href="/favicon_io/favicon-32x32.png"></link>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      {/* <ColorModeContext.Provider value={colorMode}> */}
      {loading ? (
        // <LinearProgress color="inherit" />
        <div id="loader">
          <div class="zipper">
            {/* <div class="zip-line"></div> */}
            {/* <div class="zip-puller"></div> */}
          </div>
        </div>
      ) : (
        <ColorModeContext.Provider
          value={{ darkMode, setDarkMode: _setDarkMode }}
        >
          {/* darkMode ? darkTheme : theme */}
          <ThemeProvider theme={darkTheme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}

            <CssBaseline />
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ThemeProvider>
        </ColorModeContext.Provider>
      )}
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
