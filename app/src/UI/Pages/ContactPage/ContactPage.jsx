import React, { useCallback, useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { TextField, IconButton } from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import { MessageList } from "react-chat-elements";
import DatabaseHandler from "../../../Database";
import UploadFile from "./UploadFile";
import User from "../../../Database/Schemas/User";

import "react-chat-elements/dist/main.css";
import "./ReactChatElementsCustomized.css";


const useStyles = makeStyles(theme => ({
  toolbar: theme.mixins.toolbar,
  content: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
  },
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(1),
  },
  input: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.paper,
    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
  },
}));

const PAGE_SIZE = 20; // 20 messages

function formatMessage(message) {
  const didWeSend = localStorage.getItem("id") === message.senderId;

  const common = {
    originalData: message,
    position: didWeSend ? "right" : "left",
    replyButton: true,
    theme: "white",
    notch: false,
    // TODO: dont use localstorage
    // title: didWeSend ? localStorage.getItem("username") : message.partnerUsername,
    // titleColor: this.getRandomColor(), // TODO add to user
    date: didWeSend ? message.sentDate : message.receivedDate,
  };

  switch (message.type) {
    case "TEXT":
      return {
        ...common,
        type: "text",
        text: message.text,
      };
    case "FILE":
      return {
        ...common,
        type: "file",
        text: message.file.name,
        data: {
          download: true,
          click: true,
          status: {
            download: true,
            //   error: false || loading: true
          },
        },
      };
    case "PHOTO": {
      const blob = new Blob([message.file.data]);
      const uri = URL.createObjectURL(blob);

      return {
        ...common,
        type: "photo",
        data: {
          uri,
          download: true,
          click: true,
          width: 300,
          height: 200,
          status: {
            download: true,
          },
        },
      };
    }
    default:
      // TODO THROW ERROR
      return null;
  }
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
 * @param sendText
 * @param {function() : Promise} sendFile
 */
export default function ContactPage({ selectedContact, sendText, sendFile }) {
  const classes = useStyles();

  const [page, setPage] = useState(0);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [files, setFiles] = useState([]);
  const [dragElement, setDragElement] = useState(null);
  const messagesEndRef = useRef(null);

  /* LOAD MESSAGES AND LISTEN FOR NEW ONES */
  useEffect(() => {
    const handleMessages = (newMessage) => {
      setMessageList(prevMessages => (
        [
          ...prevMessages,
          formatMessage(newMessage),
        ]
      ));
    };

    selectedContact.on(User.EVENTS.MESSAGE, handleMessages);

    selectedContact.on(User.EVENTS.CLEAR, () => setMessageList([]));

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
      setMessageList(prevValues => {
        prevValues.forEach(value => {
          if (value.type === "PHOTO") {
            URL.revokeObjectURL(value.data.uri);
          }
        });

        return [];
      });

      setPage(0);
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

  /* HANDLERS */
  const handleDragOver = useCallback((event) => {
    event.preventDefault();

    console.log("Drag over");
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();

    console.log("drop");
    if (event.target === dragElement) {
      setDragElement(null);
    }
  }, [dragElement]);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();

    if (!dragElement) {
      console.log("Drag enter");
      setDragElement(event.currentTarget);
    }
  }, [dragElement]);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();

    if (dragElement === event.target) {
      console.log("Drag leave");
      setDragElement(null);
    }
  }, [dragElement]);

  const handleFileChange = useCallback(async (f) => {
    try {
      let newFiles = f.map(async file => ({
        data: new Uint8Array(await file.arrayBuffer()),
        name: file.name,
        type: file.type.split("/")[0],
      }));

      newFiles = await Promise.all(newFiles);

      setFiles(newFiles);
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const sentMessages = [];

      if (files.length) {
        // promise.all will kill client if files are too big
        for (const file of files) {
          // eslint-disable-next-line no-await-in-loop
          const sentFile = await sendFile(selectedContact, file, message);

          sentMessages.push(sentFile);
        }

        setDragElement(null);
        messagesEndRef.current.scrollIntoView();
      } else {
        const sentText = await sendText(selectedContact, message);

        sentMessages.push(sentText);
      }

      setMessage("");
      setMessageList(prevMessages => [
        ...prevMessages,
        ...sentMessages.map(sentMessage => formatMessage(sentMessage)),
      ]);
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  }, [files, sendFile, selectedContact, message, sendText]);

  const handleKeyDown = useCallback(async (event) => {
    if (!event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      await handleSubmit();
    }
  }, [handleSubmit]);


  return (
    <div
      id="contact-page"
      className={classes.content}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* push the content down so it's not under the navbar */}
      <div className={classes.toolbar} />

      {
        dragElement ? (
          <UploadFile
            handleClose={() => setDragElement(null)}
            handleChange={handleFileChange}
          />
        ) : (
          <main className={classes.chat}>
            <MessageList
              className="message-list"
              lockable
              dataSource={messageList}
              onTitleClick={() => console.log("onTitleClick")}
              onForwardClick={() => console.log("onForwardClick")}
              onReplyClick={() => console.log("onReplyClick")}
              onReplyMessageClick={() => console.log("onReplyMessageClick")}
              onDownload={(file) => console.log(file)}
              onOpen={(file) => console.log(file)}
            />
          </main>
        )
      }

      {/* Used to scroll to bottom */}
      <div ref={messagesEndRef} />

      {/* COMPOSE MESSAGE */}
      <footer className={classes.input}>
        <TextField
          id="standard-multiline-flexible"
          label="Multiline"
          variant="outlined"
          fullWidth
          multiline
          rowsMax="4"
          value={message}
          disabled={!selectedContact.isConnected}
          onKeyDown={handleKeyDown}
          onChange={(event) => setMessage(event.target.value)}
        />
        <IconButton
          aria-label="send"
          disabled={!selectedContact.isConnected}
          onClick={handleSubmit}
        >
          <SendIcon />
        </IconButton>
      </footer>
    </div>
  );
}
