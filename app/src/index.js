import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

import initializeI18n from "./i18n/initialize-i18n";

initializeI18n();


// eslint-disable-next-line react/jsx-filename-extension
ReactDOM.render(<App />, document.getElementById("root"));
