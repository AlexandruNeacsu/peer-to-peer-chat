import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import Dexie from "dexie";
import PeerInfo from "peer-info";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Auth from "./UI/Pages/Auth";
import Dashboard from "./UI/Pages/Dashboard";
import DatabaseHandler from "./Database";
import Loader from "./UI/Components/Loader";
import axios from "axios";
import Snackbar from "./UI/Components/Snackbar";
import { t } from "react-i18nify";


const theme = createMuiTheme({
  // palette: {
  //   primary: {
  //     light: "#54a75c",
  //     main: "#2a9134",
  //     dark: "#1d6524",
  //   },
  //   secondary: {
  //     light: "#3b533e",
  //     main: "#0b280e",
  //     dark: "#071c09",
  //   },
  //   background: {
  //     default: "#f7fdf8",
  //   },
  //   text: {
  //     primary: "#061407",
  //     light: "#f3fcf4",
  //   },
  //   typography: {
  //     color: "#f3fcf4",
  //   },
  // },
});


function App() {
  // TODO ensure integrity of data!(ex: someone changes username using the console)

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsRegister, setNeedsRegister] = useState(true);
  const [snackBarOptions, setSnackBarOptions] = useState({
    variant: "",
    message: "",
    open: false,
  });

  useEffect(() => {
    async function checkIfUserIsOnMachine() {
      const exists = await Dexie.exists(DatabaseHandler.DATABASE_NAME);

      setNeedsRegister(!exists);
    }

    checkIfUserIsOnMachine();
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  const handleLoginSuccess = async ({ username, password }) => {
    try {
      if (needsRegister) {
        localStorage.clear();

        const userPeerInfo = await PeerInfo.create();

        const id = userPeerInfo.id.toB58String();

        const response = await axios.post("http://192.168.1.2:8080/signup", {
          username,
          peerId: id,
          password,
        }); // TODO: handle not found, etc

        const { data } = response;

        if (data.success) {
          await DatabaseHandler.initDatabase(password);

          localStorage.setItem("id", id);
          localStorage.setItem("username", username); // !!!TODO

          const database = DatabaseHandler.getDatabase();
          await database.users.add({ id, username, peerIdJSON: userPeerInfo.id.toJSON() });
        }
      } else {
        await DatabaseHandler.initDatabase(password);
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      if (error.response) {
        setSnackBarOptions({
          variant: "error",
          message: t("Errors.RegisterUsernameError"), // TODO: add to translations
          open: true,
        });
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // TODO id not found, contact not reached, etc...
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        console.log(error);
      }
      // TODO: catch other errors, if any can raise
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {
          isAuthenticated ? (
            <Switch>
              <Route exact path="/">
                <Loader isLoading={isLoading}>
                  <Dashboard />
                </Loader>
              </Route>
              <Route path="*">
                <Redirect to="/" />
              </Route>
            </Switch>
          ) : (
            <Switch>
              <Route exact path="/auth">
                <Auth onLoginSuccess={handleLoginSuccess} needsRegister={needsRegister} />
              </Route>
              <Route path="*">
                <Redirect to="/auth" />
              </Route>
            </Switch>
          )
        }
      </Router>

      <Snackbar
        variant={snackBarOptions.variant}
        message={snackBarOptions.message}
        open={snackBarOptions.open}
        handleClose={() => setSnackBarOptions(prevState => ({ ...prevState, open: false }))}
      />
    </ThemeProvider>
  );
}

export default App;
