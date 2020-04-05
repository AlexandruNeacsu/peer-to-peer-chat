import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Auth from "./UI/Pages/Auth";
import NotFound404 from "./UI/Pages/404";
import Dashboard from "./UI/Pages/Dashboard";
import useSignalSocket from "./Hooks/useSignalSocket";


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
  // set initial auth status to true if username is set so we don't do a unnecessary render if he is actually logged in
  // servers returns 404 if we are not authenticated so this is not a problem if we handle it inside useSignalSocket
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => setIsAuthenticated(!!localStorage.getItem("username")), []);


  function handleLogout() {
    localStorage.clear();

    setIsAuthenticated(false);
  }

  const handleSuccess = () => setIsAuthenticated(true);

  // Detect user logout by checking the server response status and message.
  useEffect(() => {
    axios.interceptors.response.use(
      response => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;

          switch (status) {
            case 401:
              handleLogout();
              break;

            case 403:
              if (data.msg === "no access") {
                handleLogout();
              }

              break;
            default:
              break;
          }
        }

        return Promise.reject(error);
      },
    );
  }, []);

  // TODO add loader!
  const signalSocket = useSignalSocket(isAuthenticated, handleLogout);

  if (signalSocket && !isAuthenticated) {
    setIsAuthenticated(true);
  }

  console.log(isAuthenticated);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {
          isAuthenticated ? (
            <Switch>
              <Route
                exact
                path="/"
                render={routerProps => <Dashboard {...routerProps} signalSocket={signalSocket} />}
              />
              <Route
                exact
                path={["/login", "/register"]}
                render={routerProps => <Redirect {...routerProps} to="/" />}
              />
              <Route path="*" exact component={NotFound404} />
            </Switch>
          ) : (
            <Switch>
              <Route
                path={["/login", "/register"]}
                render={routerProps => <Auth {...routerProps} onSuccess={handleSuccess} />}
              />
              <Route path="*" render={() => <Redirect to="login" />} />
            </Switch>
          )
        }
      </Router>
    </ThemeProvider>
  );
}

export default App;
