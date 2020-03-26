import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { createMuiTheme, ThemeProvider, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Connection from "./Connection";
import Auth from "./UI/Auth";
import NotFound404 from "./UI/404";
import Dashboard from "./UI/Dashboard";


const useStyles = makeStyles(theme => ({
  app: {
    display: "flex",
    height: "100%",
  },
}));

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
  const classes = useStyles();

  const [peers, setPeers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    localStorage.clear();

    setIsAuthenticated(false);
  };


  // TODO move these to custom hooks

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


  useEffect(() => {
    async function fetchData() {
      try {
        const a = await Connection((err, socket) => {
          console.log("Socket error");
          console.log(err);

          console.log(socket);
        });

        // setIsAuthenticated(true);
        //
        // if (localStorage.getItem("username") === "lavi") {
        //   const peer = await a.findPeer("alex");
        //
        //   console.log(peer);
        // }
      } catch (error) {
        if (error instanceof CloseEvent && error.code === 100) {
          // user is not logged in
          handleLogout();
        } else {
          console.error(error.message);
        }
      }
    }

    fetchData();
  }, [isAuthenticated]);

  const handleSucces = () => setIsAuthenticated(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>

      <div className={classes.app}>


        <Router>
          {
            isAuthenticated ? (
              <Switch>
                <Route exact path="/" render={routerProps => (<Dashboard {...routerProps} />)}/>
                <Route
                  exact
                  path={["/login", "/register"]}
                  render={routerProps => (<Redirect {...routerProps} to="/"/>)}
                />
                <Route path="*" exact component={NotFound404}/>
              </Switch>
            ) : (
              <Switch>
                <Route
                  path={["/login", "/register"]}
                  render={routerProps => (<Auth {...routerProps} onSucces={handleSucces}/>)}
                />
                <Route path="*" render={() => <Redirect to="login"/>}/>
              </Switch>
            )
          }
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
