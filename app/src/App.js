import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import ContactList from "./Layout/ContactList";
import ContactPage from './Layout/ContactPage';

const useStyles = makeStyles(theme => ({
  app: {
    display: 'flex',
    height: "100%",
  },
}));


function App() {
  const classes = useStyles();

  return (
    <div className={classes.app}>
      <CssBaseline />

      <ContactList />

      <ContactPage />
    </div >
  );
}

export default App;
