import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { TextField, IconButton } from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";


const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  toolbar: theme.mixins.toolbar,
  content: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
  chat: {
    display: "flex",
    flexGrow: 1,
  },
  compose: {
    display: "flex",
    alignItems: "center",
  },
}));


export default function ContactPage() {
  const classes = useStyles();

  const [message, setMessage] = useState("");

  return (
    <div className={classes.content}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            Permanent drawer
          </Typography>
        </Toolbar>
      </AppBar>

      {/* push the content down so it's not under the navbar */}
      <div className={classes.toolbar} />

      <main className={classes.chat}>

        <div>
          asfs
        </div>

      </main>

      {/* COMPOSE MESSAGE */}
      <footer className={classes.compose}>
        <TextField
          id="standard-multiline-flexible"
          label="Multiline"
          fullWidth
          multiline
          rowsMax="4"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <IconButton aria-label="send">
          <SendIcon />
        </IconButton>
      </footer>
    </div>
  );
}
