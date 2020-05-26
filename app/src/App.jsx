import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import axios from "axios";
import Dexie from "dexie";
import PeerInfo from "peer-info";
import { t } from "react-i18nify";
import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Auth from "./UI/Pages/Auth";
import Chat from "./UI/Pages/Chat/Chat";
import DatabaseHandler from "./Database";
import Loader from "./UI/Components/Loader";
import Snackbar from "./UI/Components/Snackbar";
import theme from "./UI/Theme";


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

        const response = await axios.post("http://localhost:8080/signup", {
          username,
          peerId: id,
          password,
        }); // TODO: handle not found, etc

        const { data } = response;

        if (data.success) {
          await DatabaseHandler.initDatabase(password);

          localStorage.setItem("id", id);
          localStorage.setItem("username", username); // !!!TODO

          const defaultSignalingServers = [{ label: "default", value: "localhost", port: 9090, type: "dns4" }];
          localStorage.setItem("signal-servers", JSON.stringify(defaultSignalingServers));
          localStorage.setItem("signal-selected-servers", JSON.stringify(defaultSignalingServers));

          const defaultNameServer = { label: "default", value: "localhost:8080" };
          localStorage.setItem("name-server", JSON.stringify(defaultNameServer));
          localStorage.setItem("name-selected-server", JSON.stringify(defaultNameServer));

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
                  <Chat />
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
