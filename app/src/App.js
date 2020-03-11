import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import axios from "axios";
import ContactList from "./Layout/ContactList";
import ContactPage from './Layout/ContactPage';
import Connection from "./Connection";

const useStyles = makeStyles(theme => ({
  app: {
    display: 'flex',
    height: "100%",
  },
}));


function App() {
  const classes = useStyles();

  useEffect(() => {
    async function fetchData() {
      try {
        const username = window.prompt("nume", "alex");
        console.log(username)

        await axios.post(
          "http://localhost:8080/login",
          { username },
          {withCredentials: true}
        );

        const a = Connection();

        if (username === "lavi") {
          console.log("here");

          const peer = await a.findPeer("alex");
          

          console.log("lalal")
          console.log(peer)
        }
      } catch (error) {
        console.error(error.message)
      }
    }

    fetchData();
  }, []);

  return (
    <div className={classes.app}>
      <CssBaseline />

      <ContactList />

      <ContactPage />
    </div >
  );
}

export default App;
