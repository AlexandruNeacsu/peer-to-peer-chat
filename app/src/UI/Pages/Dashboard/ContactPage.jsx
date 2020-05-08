import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { TextField, IconButton } from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import { MessageList } from "react-chat-elements";
import DatabaseHandler from "../../../Database";

import "react-chat-elements/dist/main.css";

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
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  compose: {
    display: "flex",
    alignItems: "center",
  },
}));

const PAGE_SIZE = 15; // 15 messages

/**
 *
 * @param {User} selectedContact
 * @param sendTextMessage
 */
export default function ContactPage({ selectedContact, sendTextMessage }) {
  const classes = useStyles();

  const [page, setPage] = useState(0);
  const [isLoadNextPage, setIsLoadNextPage] = useState(true);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  // useEffect(() => {
  //   async function lala() {
  //     const database = DatabaseHandler.getDatabase();
  //     console.log(await database.messages.toArray());
  //   }
  //
  //   lala();
  // });


  /* LOAD MESSAGES */
  useEffect(() => {
    async function loadNextMessages() {
      try {
        const database = DatabaseHandler.getDatabase();
        const localUserId = localStorage.getItem("id");

        let messages;

        if (messageList.length === 0 && page === 0) {
          messages = await database.messages
            .orderBy("id")
            .limit(PAGE_SIZE)
            .toArray();
        } else if (messageList.length > page * PAGE_SIZE) {
          const lastEntry = messageList[messageList.length - 1];

          messages = await database.messages
            .where("id")
            .above(lastEntry.originalData.id)
            .limit(PAGE_SIZE)
            .toArray();
        }

        messages = messages.map(msg => ({
          originalData: msg,
          position: localUserId === msg.ownerId ? "right" : "left",
          replyButton: true,
          type: "text",
          theme: "white",
          title: selectedContact.username,
          // titleColor: this.getRandomColor(), // TODO add to user
          text: msg.data,
          status: msg.status,
          date: msg.receivedDate,
          onReplyMessageClick: () => console.log("onReplyMessageClick"),
          onReplyClick: () => console.log("onReplyClick"),
        }));

        setPage(prevPage => prevPage + 1);
        if (messages.length !== 0) {
          setMessageList(prevMessages => ([...prevMessages, ...messages]));
        }
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }

    if (isLoadNextPage) {
      loadNextMessages();

      setIsLoadNextPage(false);
    }
  }, [page, messageList, isLoadNextPage]);


  console.log(messageList);

  // TODO trimite mesaj cand apasam enter


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
        <MessageList
          className="message-list"
          lockable
          dataSource={messageList}
        />
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
        <IconButton aria-label="send" onClick={() => sendTextMessage(selectedContact.id, message)}>
          <SendIcon />
        </IconButton>
      </footer>
    </div>
  );
}
