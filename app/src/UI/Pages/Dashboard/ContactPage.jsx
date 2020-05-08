import React, { useEffect, useRef, useState } from "react";
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

const PAGE_SIZE = 20; // 15 messages

function formatMessage(message) {
  return {
    originalData: message,
    position: localStorage.getItem("id") === message.senderId ? "right" : "left",
    replyButton: true,
    type: "text",
    theme: "white",
    title: message.partnerUsername,
    // titleColor: this.getRandomColor(), // TODO add to user
    text: message.data,
    status: message.status,
    date: message.receivedDate,
    onReplyMessageClick: () => console.log("onReplyMessageClick"),
    onReplyClick: () => console.log("onReplyClick"),
  };
}


async function loadMessages(partnerId, lastEntry) {
  const database = DatabaseHandler.getDatabase();
  let messages;

  if (!lastEntry) {
    // get the latest messages and put them in numerical order
    messages = await database.conversations
      .orderBy("id")
      .reverse()
      .filter(conversation => conversation.partnerId === partnerId)
      .limit(PAGE_SIZE)
      .toArray();
  } else {
    messages = await database.conversations
      .where("id")
      .below(lastEntry.originalData.id)
      .filter(conversation => conversation.partnerId === partnerId)
      .reverse()
      .limit(PAGE_SIZE)
      .toArray();
  }

  return messages.reverse().map(msg => formatMessage(msg));
}


/**
 *
 * @param {User} selectedContact
 * @param sendTextMessage
 */
export default function ContactPage({ selectedContact, sendTextMessage }) {
  const classes = useStyles();

  const [page, setPage] = useState(0);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const messagesEndRef = useRef(null);

  /* LOAD MESSAGES AND LISTEN FOR NEW ONES */
  useEffect(() => {
    const handleMessages = (messages) => {
      setMessageList(prevMessages => (
        [
          ...prevMessages,
          ...messages.map(msg => formatMessage(msg)),
        ]
        // .sort((a, b) => b.id - a.id) // reverse sort
      ));
    };

    selectedContact.on("messages", handleMessages);

    loadMessages(selectedContact.id)
      .then((messages) => {
        setMessageList(messages);
        setPage(prevPage => prevPage + 1);

        messagesEndRef.current.scrollIntoView();
      })
      .catch((error) => {
        console.log(error);
        console.log(error.message);
      });

    return () => {
      setPage(0);
      setMessageList([]);
      selectedContact.removeListener("messages", handleMessages);
    };
  }, [selectedContact]);


  /* HANDLE PAGE SCROLL */
  useEffect(() => {
    window.onscroll = async () => {
      if (window.pageYOffset === 0 && messageList.length && (messageList.length >= page * PAGE_SIZE)) {
        try {
          const lastEntry = messageList[0];

          const messages = await loadMessages(selectedContact.id, lastEntry);

          setMessageList(prevMessages => ([...messages, ...prevMessages]));
          setPage(prevPage => prevPage + 1);
        } catch (error) {
          // TODO
          console.log(error);
          console.log(error.message);
        }
      }
    };
  }, [page, messageList, selectedContact]);

  const handleSubmit = async () => {
    const msg = await sendTextMessage(selectedContact, message);

    setMessage("");
    setMessageList(prevMessages => [
      ...prevMessages,
      formatMessage(msg),
    ]);
  };


  console.log(messageList)
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

      <div ref={messagesEndRef} />

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
        <IconButton aria-label="send" onClick={handleSubmit}>
          <SendIcon />
        </IconButton>
      </footer>
    </div>
  );
}
