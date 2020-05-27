import React from "react";
import ReactDOM from "react-dom";
import { SnackbarProvider } from "notistack";
import { ThemeProvider } from "@material-ui/core/styles";
import App from "./App";
import initializeI18n from "./i18n/initialize-i18n";
import theme from "./UI/Theme";

import "./index.css";

initializeI18n();


// eslint-disable-next-line react/jsx-filename-extension
ReactDOM.render(
  <ThemeProvider theme={theme}>

    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <App />
    </SnackbarProvider>
  </ThemeProvider>,
  document.getElementById("root")
);
