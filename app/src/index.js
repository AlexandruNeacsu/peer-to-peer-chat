import React from "react";
import ReactDOM from "react-dom";
import Entry from "./App";
import initializeI18n from "./i18n/initialize-i18n";

import "./index.css";

initializeI18n();

// eslint-disable-next-line react/jsx-filename-extension
ReactDOM.render(<Entry />, document.getElementById("root"));
