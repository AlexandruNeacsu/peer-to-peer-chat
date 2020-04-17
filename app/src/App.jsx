import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";
import Dexie from "dexie";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Auth from "./UI/Pages/Auth";
// import Dashboard from "./UI/Pages/Dashboard";
import DatabaseHandler from "./Database";


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


  // Detect user logout by checking the server response status and message.
  // useEffect(() => {
  //   axios.interceptors.response.use(
  //     response => response,
  //     (error) => {
  //       if (error.response) {
  //         const { status, data } = error.response;
  //
  //         switch (status) {
  //           case 401:
  //             handleLogout();
  //             break;
  //
  //           case 403:
  //             if (data.msg === "no access") {
  //               handleLogout();
  //             }
  //
  //             break;
  //           default:
  //             break;
  //         }
  //       }
  //
  //       return Promise.reject(error);
  //     },
  //   );
  // }, []);


  // const signalSocket = useSignalSocket(isAuthenticated, handleLogout, handleDiscover);
  //
  // if (signalSocket && !isAuthenticated) {
  //   setIsAuthenticated(true);
  // }
  //
  // console.log(isAuthenticated);

  // return (
  //   <ThemeProvider theme={theme}>
  //     <CssBaseline/>
  //     <Router>
  //       <Switch>
  //         <Route
  //           exact
  //           path="/"
  //           render={routerProps => <Dashboard {...routerProps}/>}
  //         />
  //         <Route
  //           exact
  //           path="*"
  //           render={routerProps => <Redirect {...routerProps} to="/"/>}
  //         />
  //       </Switch>
  //     </Router>
  //   </ThemeProvider>
  // );

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsRegister, setNeedsRegister] = useState(true);

  useEffect(() => {
    async function checkIfUserIsOnMachine() {
      const exists = await Dexie.exists(DatabaseHandler.DATABASE_NAME);

      setNeedsRegister(!exists);
    }

    checkIfUserIsOnMachine();
  }, []);

  const handleLoginSuccess = async ({ username, password }) => {
    await DatabaseHandler.initDatabase(password);

    localStorage.setItem("username", username);

    setIsAuthenticated(true);
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Router>
        {
          isAuthenticated ? (
            <Switch>
              <Route exact path="/">{/*<Dashboard />*/}</Route>
              <Route path="*"><Redirect to="/"/> </Route>
            </Switch>
          ) : (
            <Switch>
              <Route exact path="/auth">
                <Auth onLoginSuccess={handleLoginSuccess} needsRegister={needsRegister}/>
              </Route>
              <Route path="*"><Redirect to="/auth"/></Route>
            </Switch>
          )
        }
      </Router>
    </ThemeProvider>
  );
}

export default App;
