import React, { useCallback, useEffect, useRef, useState } from "react";
import { t } from "react-i18nify";
import clsx from "clsx";
import { MessageList } from "react-chat-elements";
import { makeStyles } from "@material-ui/core/styles";
import { IconButton, TextField } from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import ClearIcon from "@material-ui/icons/Clear";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import useTheme from "@material-ui/core/styles/useTheme";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import DatabaseHandler from "../../../Database";
import UploadFile from "./UploadFile";
import User from "../../../Database/Schemas/User";

import "react-chat-elements/dist/main.css";
import "./ReactChatElementsCustomized.css";
import PhotoDialog from "./PhotoDialog";
import Loader from "../../Components/Loader";


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
  inputContainer: {
    position: "sticky",
    bottom: 0,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.paper,
    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
  },
  input: {
    flexGrow: 1,
  },
  replyContainer: {
    flexBasis: "100%",
    display: "flex",
    marginBottom: theme.spacing(2),
  },
  replyContent: {
    display: "flex",
    flexGrow: 1,
  },
  leftBorder: {
    width: theme.spacing(1),
    borderTopLeftRadius: theme.spacing(1),
    borderBottomLeftRadius: theme.spacing(1),
  },
  leftBorderSelf: {
    backgroundColor: theme.palette.primary.main,
  },
  leftBorderContact: {
    backgroundColor: theme.palette.secondary.main,
  },
  replyText: {
    padding: theme.spacing(2),
    borderTopRightRadius: theme.spacing(1),
    borderBottomRightRadius: theme.spacing(1),
    backgroundColor: "#4b4e55",
    color: theme.palette.white,
    flexGrow: 1,
  },
  download: {
    display: "none"
  },
}));

const PAGE_SIZE = 50; // 50 messages
const MAX_FILE_NAME_LENGTH = 15;

function formatMessage(message) {
  const didWeSend = localStorage.getItem("id") === message.senderId;

  const common = {
    originalData: message,
    position: didWeSend ? "right" : "left",
    replyButton: true,
    theme: "white",
    notch: false,
    // TODO: dont use localstorage
    date: didWeSend ? message.sentDate : message.receivedDate,
  };

  switch (message.type) {
    case "TEXT":
      return {
        ...common,
        type: "text",
        text: message.text,
        reply: message.replyMessage ? {
          title: message.replyMessage.originalData.senderId === localStorage.getItem("id")
            ? localStorage.getItem("username")
            : message.partnerUsername,
          titleColor: message.replyMessage.originalData.senderId === localStorage.getItem("id")
            ? "#388E3C"
            : "#1976D2",
          message: message.replyMessage.text,
        } : undefined,
      };
    case "FILE":
      return {
        ...common,
        type: "file",
        text: message.file.name && message.file.name.length > 15
          ? `${message.file.name.slice(0, MAX_FILE_NAME_LENGTH)}...`
          : message.file.name,
        data: {
          download: true,
          click: true,
          status: {
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
          click: true,
          width: 300,
          height: 200,
        },
      };
    }
    default:
      // TODO THROW ERROR
      return null;
  }
}


async function loadMessages(partnerId, limit) {
  console.log(partnerId)
  const database = DatabaseHandler.getDatabase();
  const messages = await database.conversations
    .orderBy("id")
    .reverse()
    .filter(conversation => conversation.partnerId === partnerId)
    .limit(limit)
    .toArray();


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
  const theme = useTheme();
  const shouldDownloadFile = useMediaQuery(theme.breakpoints.down("sm"));

  const [page, setPage] = useState(1);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyMessage, setReplyMessage] = useState();

  const [dragElement, setDragElement] = useState(null);

  const messagesEndRef = useRef();
  const downloadRef = useRef();
  const mainDivRef = useRef();

  /* LOAD MESSAGES AND LISTEN FOR NEW ONES */
  useEffect(() => {
    const handleMessages = (newMessage) => {
      setMessageList(prevMessages => (
        [
          ...prevMessages,
          formatMessage(newMessage),
        ]
      ));
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView();
      }
    };

    selectedContact.on(User.EVENTS.MESSAGE, handleMessages);

    selectedContact.on(User.EVENTS.CLEAR, () => setMessageList([]));

    loadMessages(selectedContact.id, PAGE_SIZE)
      .then((messages) => {
        setMessageList(messages);
        setPage(prevPage => prevPage + 1);

        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView();
        }

        setIsLoadingMessages(false);
      })
      .catch((error) => {
        console.log(error);
        console.log(error.message);
      });

    return () => {
      setMessageList(prevValues => {
        prevValues.forEach(value => {
          if (value && value.type === "PHOTO") {
            URL.revokeObjectURL(value.data.uri);
          }
        });

        return [];
      });

      setPage(0);
      selectedContact.removeListener("messages", handleMessages);
      setIsLoadingMessages(true);
    };
  }, [selectedContact]);

  /* HANDLE PAGE SCROLL */
  useEffect(() => {
    window.onscroll = async () => {
      const initialHeight = document.body.clientHeight;
      const initialPos = window.pageYOffset;
      const percentScrolled = Math.round((window.pageYOffset / initialHeight) * 100);

      if (!isLoadingMessages && percentScrolled <= 20 && messageList.length && (messageList.length >= (page - 1) * PAGE_SIZE)) {
        try {
          setIsLoadingMessages(true);

          const messages = await loadMessages(selectedContact.id, page * PAGE_SIZE);

          setMessageList(messages);
          setPage(prevPage => prevPage + 1);
          setIsLoadingMessages(false);

          // keep the same position
          window.scrollTo(0, initialPos + (document.body.clientHeight - initialHeight));
        } catch (error) {
          // TODO
          console.log(error);
          console.log(error.message);
        }
      }
    };
  }, [page, messageList, selectedContact.id, isLoadingMessages]);

  /* HANDLERS */
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();

    if (event.target === dragElement) {
      setDragElement(null);
    }
  }, [dragElement]);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();

    if (!dragElement && selectedContact.isConnected && !selectedContact.isBlocked) {
      setDragElement(event.currentTarget);
    }
  }, [dragElement, selectedContact]);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();

    if (dragElement === event.target) {
      setDragElement(null);
    }
  }, [dragElement]);

  const handleFileChange = useCallback(async (f, append = false) => {
    try {
      let newFiles = f.map(async file => ({
        data: new Uint8Array(await file.arrayBuffer()),
        name: file.name,
        type: file.type.split("/")[0],
      }));

      newFiles = await Promise.all(newFiles);

      if (append) {
        setFiles(prevState => [...prevState, newFiles]);
      } else {
        setFiles(newFiles);
      }
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isSending) {
      try {
        const sentMessages = [];

        if (files.length) {
          setIsSending(true);

          // promise.all will kill client if files are too big
          for (const file of files) {
            // eslint-disable-next-line no-await-in-loop
            const sentFile = await sendFile(selectedContact, file, message);

            sentMessages.push(sentFile);
          }

          setDragElement(null);
          messagesEndRef.current.scrollIntoView();
        }

        if (message) {
          const formattedReplyMessage = { ...replyMessage };

          if (replyMessage && formattedReplyMessage.originalData.file) {
            formattedReplyMessage.text = formattedReplyMessage.originalData.file.name;

            delete formattedReplyMessage.data;
            delete formattedReplyMessage.originalData.file;
          }

          const sentText = await sendText(selectedContact, message, replyMessage ? formattedReplyMessage : null);

          if (sentText) {
            sentMessages.push(sentText);
          }
        }

        if (sentMessages.length) {
          setMessage("");
          setReplyMessage(null);
          setMessageList(prevMessages => [
            ...prevMessages,
            ...sentMessages.map(sentMessage => formatMessage(sentMessage)),
          ]);

          messagesEndRef.current.scrollIntoView();
        }
        setIsSending(false);
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }
  }, [isSending, files, message, sendFile, selectedContact, replyMessage, sendText]);

  const handleKeyDown = useCallback(async (event) => {
    if (!event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      await handleSubmit();
    }
  }, [handleSubmit]);

  const handleReplyMessageClick = (item) => setMessageList(prevState => prevState.map(e => {
    if (e.originalData.id === item.originalData.replyMessage.originalData.id) {
      return {
        ...e,
        focus: true,
      };
    }

    return e;
  }));

  const handleMessageFocused = (item) => setTimeout(() => setMessageList(prevState => prevState.map(e => {
    if (e.originalData.id === item.originalData.id) {
      return {
        ...e,
        focus: false,
      };
    }

    return e;
  })), 1500);

  const handleDownload = (file) => {
    let objectUrl;

    if (file.type === "file") {
      const blob = new Blob([file.originalData.file.data]);
      objectUrl = URL.createObjectURL(blob);
    } else {
      objectUrl = file.data.uri;
    }

    downloadRef.current.href = objectUrl;
    downloadRef.current.download = file.originalData.file.name;
    downloadRef.current.click();
  };

  const handleUploadClick = useCallback(() => {
    setDragElement(mainDivRef.current);
  }, []);

  const handleImage = useCallback((imgMessage) => {
    if (shouldDownloadFile) {
      handleDownload(imgMessage);
    } else {
      setSelectedFile(imgMessage && imgMessage.data ? imgMessage : null);
    }
  }, [shouldDownloadFile]);

  return (
    <div
      id="contact-page"
      className={classes.content}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      ref={mainDivRef}
    >
      {/* push the content down so it's not under the navbar */}
      <div className={classes.toolbar} />

      <main className={classes.chat}>
        <Loader isLoading={isSending}>

          {
            dragElement ? (
              <UploadFile
                handleClose={() => setDragElement(null)}
                handleChange={handleFileChange}
              />
            ) : (
              <MessageList
                className="message-list"
                lockable
                dataSource={messageList}
                onReplyClick={setReplyMessage}
                onReplyMessageClick={handleReplyMessageClick}
                onMessageFocused={handleMessageFocused}
                onDownload={handleDownload}
                onOpen={handleImage}
              />
            )
          }
        </Loader>
      </main>


      {/* Used to scroll to bottom */}
      <div ref={messagesEndRef} />

      <footer className={classes.inputContainer}>
        {
          replyMessage && (
            <div className={classes.replyContainer}>
              <div className={classes.replyContent}>
                <span className={clsx(
                  classes.leftBorder,
                  replyMessage.position === "right" ? classes.leftBorderSelf : classes.leftBorderContact,
                )}
                />

                <div className={classes.replyText}>
                  {replyMessage.text}
                </div>
              </div>

              <IconButton
                aria-label="clear"
                color="primary"
                onClick={() => setReplyMessage(null)}
              >
                <ClearIcon />
              </IconButton>
            </div>
          )
        }
        <div className={classes.input}>
          <TextField
            input={classes.input}
            placeholder={t("Chat.Write")}
            variant="outlined"
            fullWidth
            multiline
            rowsMax="4"
            value={message}
            disabled={selectedContact.isBlocked || !selectedContact.isConnected}
            onKeyDown={handleKeyDown}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>

        <IconButton
          aria-label={t("Chat.Send")}
          color={selectedContact.isConnected && message ? "primary" : undefined}
          disabled={selectedContact.isBlocked || !selectedContact.isConnected || (!message && !files.length)}
          onClick={handleSubmit}
        >
          <SendIcon />
        </IconButton>

        <IconButton
          aria-label={t("Chat.Upload")}
          color={!selectedContact.isBlocked && selectedContact.isConnected ? "primary" : undefined}
          disabled={selectedContact.isBlocked || !selectedContact.isConnected}
          onClick={handleUploadClick}
        >
          <AttachFileIcon />
        </IconButton>

      </footer>

      {/* eslint-disable-next-line jsx-a11y/anchor-has-content,jsx-a11y/anchor-is-valid */}
      <a ref={downloadRef} className={classes.download} />

      <PhotoDialog
        open={!!selectedFile}
        image={selectedFile && selectedFile.data.uri}
        onClose={() => handleImage(null)}
        onDownload={() => handleDownload(selectedFile)}
      />
    </div>
  );
}
