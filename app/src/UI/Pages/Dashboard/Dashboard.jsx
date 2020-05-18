/* eslint-disable no-await-in-loop */
import React, { useEffect, useState } from "react";
import axios from "axios";
import PeerId from "peer-id";
import pushable from "it-pushable";
import SimplePeer from "simple-peer";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import CallIcon from "@material-ui/icons/Call";
import GroupIcon from "@material-ui/icons/Group";
import Badge from "@material-ui/core/Badge";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import ContactPage from "./ContactPage";
import AddContactDialog from "./AddContactDialog";
import RequestsPopper from "./RequestsPopper";
import DatabaseHandler from "../../../Database";
import createNode, { receiveData, sendData } from "../../../Connection/Bundle";
import Loader from "../../Components/Loader";
import User from "../../../Database/Schemas/User";


const drawerWidth = 280;
const MAX_CHAT_ITEM_SUBTITLE = 15;

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  toolbar: theme.mixins.toolbar,
  userItems: {
    display: "flex",
    justifyContent: "space-between",
  },
}));

/**
 *
 * @param {string} B58StringId
 * @param {string} contactUsername
 * @return {Promise<void>}
 */
async function acceptRequest(B58StringId, contactUsername) {
  const database = DatabaseHandler.getDatabase();

  await database.transaction("rw", database.requests, database.users, async () => {
    await database.requests.delete(B58StringId);

    await database.users.add({ id: B58StringId, username: contactUsername });
  });
}

/**
 *
 * @param setContacts
 * @param contactId
 * @param fields
 * @return {Promise<User>}
 */
function updateContact(setContacts, contactId, fields) {
  return new Promise(resolve => {
    setContacts(previousContacts => {
      const contactIndex = previousContacts.findIndex(e => e.id === contactId);

      // node is a contact
      if (contactIndex !== -1) {
        const newContacts = [...previousContacts];

        /** @type {User} */
        const connectedContact = newContacts[contactIndex];

        Object.assign(connectedContact, fields);

        resolve(connectedContact);

        // don't use the same reference
        return newContacts;
      }

      resolve(null);

      return previousContacts;
    });
  });
}

async function call(node, user) {
  // TODO: maybe combine sendFunctions
  if (user) {
    try {
      // const peerId = PeerId.createFromB58String(user);

      // const initialMessage = {
      //   type: "CALL",
      //   username: user.username,
      // };

      const { stream } = await node.dialProtocol(user.peerId, "/call/1.0.0"); // todo: works withouth info?
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log(videoStream)

      const peer = new SimplePeer({ initiator: true, stream: videoStream, trickle: false });

      peer.on("signal", async data => {
        await sendData(stream.sink, [JSON.stringify(data)]);
        console.log("piped")

        let signalData = await receiveData(stream.source);
        console.log("received")

        if (signalData.length) {
          signalData = JSON.parse(signalData.shift().toString());
          console.log(signalData)

          peer.signal(signalData);
        }
      });

      const video = document.querySelector("video");


      if ("srcObject" in video) {
        video.srcObject = videoStream;
      } else {
        video.src = window.URL.createObjectURL(videoStream); // for older browsers
      }

      await video.play();
    } catch (error) {
      // TODO, maybe try to resend, show disconnected, etc
      console.log(error);
      console.log(error.message);
    }
  }
}

const FILE_PARTS = {};

function Dashboard() {
  const classes = useStyles();


  // TODO clean this mess
  const [username] = useState(localStorage.getItem("username"));
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  // TODO: show a message or something if not connected to a peer
  const [isConnectedToPeers, setIsConnectedToPeer] = useState(false);
  const [ownNode, setOwnNode] = useState(null);


  /** INITIALIZE NODE */
  useEffect(() => {
    /* UTILITY FUNCTIONS */

    /**
     *
     * @param {PeerInfo} contactPeerInfo
     * @param {boolean} newConnectionStatus
     */
    async function updateContactConnectionStatus(contactPeerInfo, newConnectionStatus) {
      if (newConnectionStatus) {
        setIsConnectedToPeer(true);
      }

      await updateContact(
        setContacts,
        contactPeerInfo.id.toB58String(),
        {
          isConnected: newConnectionStatus,
          peerInfo: contactPeerInfo,
        },
      );
    }

    /* PROTOCOLS AND EVENTS */
    async function handleAddProtocol({ connection, stream }) {
      // TODO: is this concurrent safe?
      // TODO: do we need to close the connection? how about on a refuse? or after final response?
      const id = connection.remotePeer.toB58String();

      try {
        const database = DatabaseHandler.getDatabase();

        const messages = await receiveData(stream.source);
        const message = messages.shift().toString();

        switch (message) {
          case "ADD": {
            const request = { id, username: messages.shift().toString() };

            let status;

            await database.transaction("rw", database.requests, database.users, async () => {
              const alreadyRegistered = await database.requests.get({ id: request.id });

              if (alreadyRegistered && alreadyRegistered.sent) {
                // we sent a request and it wasn't accepted
                // just accept the request
                await acceptRequest(request.id, request.username);

                status = "ACCEPTED";
              } else if (!alreadyRegistered) {
                await database.requests.add({ ...request, sent: false });

                status = "REGISTERED";
              }
            });

            // TODO
            await sendData(stream.sink, [status]);

            if (status === "REGISTERED") {
              setReceivedRequests(preValues => [...preValues, request]);
            } else {
              const user = new User(request.id, request.username);
              user.isConnected = true;

              setContacts(prevContacts => ([
                ...prevContacts,
                user,
              ]));
            }
            break;
          }
          case "ACCEPTED": {
            // response to a contact request we sent at another moment in time

            await database.transaction("rw", database.requests, database.users, async () => {
              const request = await database.requests.get({ id });

              if (request && request.sent) {
                // we sent a request and it wasn't accepted
                // just accept the request
                await acceptRequest(id, request.username);

                const user = new User(id, request.username);
                user.isConnected = true;

                setContacts(prevContacts => ([
                  ...prevContacts,
                  user,
                ]));

                setSentRequests(prevRequests => prevRequests.filter(e => e.id !== id));

                await sendData(stream.sink, ["OK"]);
              } else {
                // TODO: sent not registered message
              }
            });
            break;
          }
          case "REJECTED": {
            const request = await database.requests.get({ id });

            if (request) {
              await database.requests.delete(id);


              setSentRequests(prevRequests => prevRequests.filter(req => req.id !== id));
              // TODO: maybe send confirmation?
              // TODO: add notification: has been rejected
            }
            break;
          }
          default:
            console.log(`Received unknown message ${message}`);
        }
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }

    async function handleChatProtocol(node, { connection, stream }) {
      const database = DatabaseHandler.getDatabase();
      const user = await database.users.get({ id: connection.remotePeer.toB58String() });

      if (!user) {
        // TODO: do we close the connection afther the message?
        await sendData(stream.sink, ["REFUSED"]);

        // TODO: is ok?
        await node.hangUp(connection.remotePeer);
      } else {
        try {
          const data = await receiveData(stream.source);

          if (data.length) {
            const structuredMessages = [];

            const initialMessage = JSON.parse(data.shift().toString());

            const chatItem = {
              title: user.username,
              date: new Date(),
              unread: 0,
            };

            switch (initialMessage.type) {
              case "TEXT": {
                // TODO: use message class
                // TODO: parse the message to ensure structure
                const message = {
                  type: initialMessage.type,
                  sentDate: initialMessage.sentDate,
                  text: initialMessage.text,
                  receivedDate: chatItem.date,
                  partnerId: user.id,
                  partnerUsername: user.username, // TODO: this will show old username in chat history
                  senderId: user.id,
                  status: "received", // TODO move to an enum
                };

                structuredMessages.push(message);

                chatItem.subtitle = message.text.slice(0, MAX_CHAT_ITEM_SUBTITLE);

                break;
              }
              case "FILE": {
                if (FILE_PARTS[initialMessage.file.name]) {
                  if (!initialMessage.final) {
                    FILE_PARTS[initialMessage.file.name]
                      .data
                      .push(data.shift().slice());
                  } else {
                    const parts = FILE_PARTS[initialMessage.file.name].data;
                    // Get the total length of all arrays.
                    let length = 0;
                    parts.forEach(item => {
                      length += item.length;
                    });

                    const mergedArray = new Uint8Array(length);
                    let offset = 0;
                    parts.forEach(item => {
                      mergedArray.set(item, offset);
                      offset += item.length;
                    });

                    delete FILE_PARTS[initialMessage.file.name];

                    structuredMessages.push({
                      type: initialMessage.file.type,
                      file: {
                        name: initialMessage.file.name,
                        type: initialMessage.file.type,
                        data: mergedArray,
                      },
                      sentDate: initialMessage.sentDate,
                      receivedDate: new Date(),
                      partnerId: user.id,
                      partnerUsername: user.username, // TODO: this will show old username in chat history
                      senderId: user.id,
                      status: "received", // TODO move to an enum
                    });


                    if (initialMessage.text) {
                      // TODO: check if type is String
                      const textMessage = {
                        type: "TEXT",
                        sentDate: initialMessage.sentDate,
                        text: initialMessage.text,
                        receivedDate: new Date(),
                        partnerId: user.id,
                        partnerUsername: user.username, // TODO: this will show old username in chat history
                        senderId: user.id,
                        status: "received", // TODO move to an enum
                      };

                      structuredMessages.push(textMessage);

                      chatItem.subtitle = initialMessage.text.slice(0, MAX_CHAT_ITEM_SUBTITLE);
                    } else {
                      chatItem.subtitle = "POZA TODO"; // TODO
                    }
                  }
                } else {
                  FILE_PARTS[initialMessage.file.name] = {
                    name: initialMessage.file.name,
                    type: initialMessage.file.type,
                    data: [data.shift().slice()],
                  };
                }

                break;
              }
              default:
                // TODO throw
                break;
            }

            if (structuredMessages.length) {
              await database.transaction("rw", database.users, database.conversations, async () => {
                await database.conversations.bulkAdd(structuredMessages);

                chatItem.unread = await database.conversations.where({
                  status: "received",
                  partnerId: user.id,
                }).count();

                await database.users.put({ ...user, chatItem });
              });

              /**
               * @type {User}
               */
              const contact = await updateContact(setContacts, user.id, { chatItem });

              if (contact) {
                contact.handleMessages(structuredMessages);
              }
            }
          } else {
            // TODO throw MessageIsNullException or something
          }
        } catch (error) {
          // TODO
          console.log(error);
          console.log(error.message);
        }
      }
    }

    async function handleCallProtocol(node, { connection, stream }) {
      // const database = DatabaseHandler.getDatabase();
      // const user = await database.users.get({ id: connection.remotePeer.toB58String() });

      // if (!user) {
      //   // TODO: do we close the connection afther the message?
      //   await sendData(stream.sink, ["REFUSED"]);
      //
      //   // TODO: is ok?
      //   await node.hangUp(connection.remotePeer);
      // } else {
      try {
        console.log("answering");

        let signalData = await receiveData(stream.source);
        signalData = JSON.parse(signalData.shift().toString());

        const peer = new SimplePeer({ initiator: false, trickle: false });
        peer.signal(signalData);

        peer.on("signal", async data => {
          await sendData(stream.sink, [JSON.stringify(data)]);
        });

        peer.on("stream", videoStream => {
          // got remote video stream, now let's show it in a video tag
          const video = document.querySelector("video");

          console.log("video")
          console.log(videoStream)

          if ("srcObject" in video) {
            video.srcObject = videoStream;
          } else {
            video.src = window.URL.createObjectURL(videoStream); // for older browsers
          }

          video.play();
        });
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
      // }
    }

    /* MAIN */
    async function getOwnNode() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        const user = await database.users.get({ id: userId });

        const peerId = await PeerId.createFromJSON(user.peerIdJSON);
        const node = await createNode(peerId);

        node.on("peer:connect", async (peerInfo) => {
          // this should be done automatically by libp2p
          // but it's not
          await node.dial(peerInfo);
          // await node._dht._add(peerInfo);


          await updateContactConnectionStatus(peerInfo, true);
        });
        node.on("peer:disconnect", (peerInfo) => updateContactConnectionStatus(peerInfo, false));
        node.on("error", (err) => {
          console.log(err);
          console.log(err.message);
        });

        node.handle("/add/1.0.0", handleAddProtocol); // TODO gestion this better
        node.handle("/chat/1.0.0", (connectionData) => handleChatProtocol(node, connectionData));
        node.handle("/call/1.0.0", (connectionData) => handleCallProtocol(node, connectionData));


        await node.start();

        setOwnNode(node);
      } catch (error) {
        // todo: catch DatabaseHandler.getDatabase() errors
        console.error(error);
        console.error(error.message);
      }
    }

    if (!ownNode) {
      getOwnNode();
    }
  }, [ownNode, selectedContact]);

  /* LOAD DATABASE DATA */
  useEffect(() => {
    async function getDatabaseData() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        /** @type {Array<User>} */
        const users = await database.users.where("id").notEqual(userId).toArray();

        /** @type {Object[]} */
        const requests = await database.requests.toArray();

        setContacts(users);
        setReceivedRequests(requests.filter(request => !request.sent));
        setSentRequests(requests.filter(request => request.sent));
      } catch (error) {
        console.log(error);
        console.log(error.message);
        // TODO set error snackbar!, peer not found, node not created...
      }
    }

    getDatabaseData();
  }, []);

  /* HANDLERS */
  const handleAddContact = async (contactUsername) => {
    // TODO redial for peers we have the id but didn't found!
    try {
      // get the associated peerId
      const response = await axios.get(`http://192.168.0.2:8080/username/${contactUsername}`); // TODO: handle not found, etc
      const { peerId: B58StringId } = response.data;
      const contact = new User(B58StringId, contactUsername);

      const database = DatabaseHandler.getDatabase();
      const isInDatabase = await database.requests.get({ id: contact.id });

      const peerId = PeerId.createFromB58String(contact.id);

      contact.peerInfo = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      // try to dial
      const { stream } = await ownNode.dialProtocol(contact.peerInfo, "/add/1.0.0");

      /*
      TODO: what to do if peer is not found
      how do we handle accepting the contact request locally
      and then send our response to the remote user when connection is available
      */

      if (isInDatabase && !isInDatabase.sent) {
        // we received a request and we haven't accepted it
        await acceptRequest(contact.id, contactUsername);

        setContacts(prevContacts => ([...prevContacts, contact]));

        // send our response
        await sendData(stream.sink, ["ACCEPTED"]);

        const messages = await receiveData(stream.source);
        const message = messages.shift().toString();

        if (message === "OK") {
          // TODO set snackbar to succesful and say that the we had a request and we accepted it

          console.log("OK");
        } else {
          // TODO crash, burn
        }

        // TODO: snackbar that it was accepted?
      } else if (!isInDatabase) {
        await sendData(stream.sink, ["ADD", username]);

        const messages = await receiveData(stream.source);
        const message = messages.shift().toString();

        if (message === "REGISTERED") {
          // TODO set snackbar to succesful

          await database.requests.add({ ...contact.export(), sent: true }); // TODO: wouldn't contact id clash with request id?
          setSentRequests(prevValues => ([...prevValues, contact]));
        } else if (message === "ACCEPTED") {
          await database.users.add(contact.export());

          setContacts(prevContacts => ([...prevContacts, contact]));
        }
      }
    } catch (error) {
      if (error.response) {
        // TODO: handle username not found, server error from nameservice, etc
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // TODO id not found, contact not reached, etc...
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        console.log(error);
      }
    }
  };

  async function handleAcceptRequest(B58StringId, contactUsername) {
    try {
      await acceptRequest(B58StringId, contactUsername);

      // TODO: resend accept when peer is online
      const peerId = PeerId.createFromB58String(B58StringId);

      const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      // try to dial
      const { stream } = await ownNode.dialProtocol(info, "/add/1.0.0");
      await sendData(stream.sink, ["ACCEPTED"]); // TODO what if they didn't receive the message?

      const contact = new User(B58StringId, contactUsername);
      contact.peerInfo = info;

      // TODO use user object
      setContacts(prevContacts => ([...prevContacts, contact]));
      setReceivedRequests(prevRequsts => prevRequsts.filter(req => req.id !== B58StringId));
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  }

  async function handleRejectRequest(B58StringId) {
    try {
      const database = DatabaseHandler.getDatabase();
      await database.requests.delete(B58StringId);

      // TODO: resend accept when peer is online
      const peerId = PeerId.createFromB58String(B58StringId);

      const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      // try to dial
      const { stream } = await ownNode.dialProtocol(info, "/add/1.0.0");
      await sendData(stream.sink, ["REJECTED"]); // TODO what if they didn't receive the message?

      // TODO: maybe await for confirmation?

      // TODO use user object
      setReceivedRequests(prevRequsts => prevRequsts.filter(req => req.id !== B58StringId));
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  }

  async function handleSelectContact(newContact) {
    async function setMessagesStatus(contact) {
      try {
        const updatedContact = await updateContact(
          setContacts,
          contact.id,
          {
            chatItem: {
              ...contact.chatItem,
              unread: 0,
            },
          },
        );

        const database = DatabaseHandler.getDatabase();
        await database.transaction("rw", database.users, database.conversations, async () => {
          // can't use modify, will corupt data (BUG)
          const conversations = await database.conversations
            .where({
              status: "received",
              partnerId: contact.id,
            })
            .toArray();

          conversations.forEach(e => {
            e.status = "read";
          });

          await database.conversations.bulkPut(conversations);
          await database.users.put(updatedContact.export());
        });
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }

    newContact.on("messages", () => setMessagesStatus(newContact));

    if (newContact.chatItem.unread && (!selectedContact || (newContact.id !== selectedContact.id))) {
      await setMessagesStatus(newContact, "read");
    }

    setSelectedContact(prevContact => {
      if (prevContact) {
        prevContact.removeAllListeners("messages");
      }

      return newContact;
    });
  }

  /**
   *
   * @param {User} user
   * @param {String} text
   * @return {Promise<{sentDate: Date, senderId: string, data: *, partnerUsername: string, partnerId: String, type: string, status: string}>}
   */
  async function sendTextMessage(user, text) {
    if (user && text) {
      try {
        const message = {
          type: "TEXT",
          sentDate: new Date(), // TODO: repalce with new Date() ?
          text,
        };

        const peerId = PeerId.createFromB58String(user.id);
        // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
        const { stream } = await ownNode.dialProtocol(peerId, "/chat/1.0.0"); // todo: works withouth info?

        await sendData(stream.sink, [JSON.stringify(message)]);

        const structuredMessage = {
          // TODO: handle images, maps, etc...
          ...message,
          partnerId: user.id,
          partnerUsername: user.username, // TODO: will show old username in chat history
          senderId: localStorage.getItem("id"),
          status: "sent", // TODO move to an enum && handle wainting status(before sending with sendData)
        };

        const contact = await updateContact(
          setContacts,
          user.id,
          {
            chatItem: {
              title: user.username,
              subtitle: text.slice(0, MAX_CHAT_ITEM_SUBTITLE),
              date: message.sentDate,
              unread: 0, // sanity check
            },
          },
        );

        const database = DatabaseHandler.getDatabase();
        await database.transaction("rw", database.users, database.conversations, async () => {
          await database.conversations.add(structuredMessage);
          await database.users.put(contact.export());
        });

        return structuredMessage;
      } catch (error) {
        // TODO, maybe try to resend, show disconnected, etc
        console.log(error);
        console.log(error.message);

        return null;
      }
    }

    return null;
  }

  /**
   *
   * @param {User} user
   * @param {Uint8Array} file
   * @param {String} text
   * @return {Promise<{senderId: string, partnerUsername: *, partnerId: *, status: string}>}
   */
  async function sendFile(user, file, text) {
    // TODO: maybe combine sendFunctions
    if (user && file) {
      try {
        const peerId = PeerId.createFromB58String(user.id);

        // TODO check files format {file: FILE, text: String}
        const initialMessage = {
          type: "FILE",
          file: {
            name: file.name,
            type: file.type === "image" ? "PHOTO" : "FILE",
          },
        };

        for (let i = 0; i < file.data.length; i += 200_000) {
          // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
          const { stream } = await ownNode.dialProtocol(peerId, "/chat/1.0.0"); // todo: works withouth info?

          const source = pushable();
          source.push(JSON.stringify(initialMessage));
          source.push(file.data.slice(i, i + 200_000));
          source.end();

          await sendData(stream.sink, source);
        }

        // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
        const { stream } = await ownNode.dialProtocol(peerId, "/chat/1.0.0"); // todo: works withouth info?

        // TODO check files format {file: FILE, text: String}
        const finalMessage = {
          type: "FILE",
          final: true,
          text,
          sentDate: new Date(),
          file: {
            name: file.name,
            type: file.type === "image" ? "PHOTO" : "FILE",
          },
        };

        await sendData(stream.sink, [JSON.stringify(finalMessage)]);


        const structuredMessages = [{
          type: finalMessage.file.type,
          sentDate: finalMessage.sentDate,
          partnerId: user.id,
          partnerUsername: user.username, // TODO: will show old username in chat history
          senderId: localStorage.getItem("id"),
          status: "sent", // TODO move to an enum && handle wainting status(before sending with sendData)
          file,
        }];

        if (text) {
          const textMessage = {
            type: "TEXT",
            sentDate: finalMessage.sentDate,
            partnerId: user.id,
            partnerUsername: user.username, // TODO: will show old username in chat history
            senderId: localStorage.getItem("id"),
            status: "sent", // TODO move to an enum && handle wainting status(before sending with sendData)
            text,
          };

          structuredMessages.push(textMessage);
        }

        const contact = await updateContact(
          setContacts,
          user.id,
          {
            chatItem: {
              title: user.username,
              subtitle: text || "POZA TODO",
              date: finalMessage.sentDate,
              unread: 0, // sanity check
            },
          },
        );

        const database = DatabaseHandler.getDatabase();
        await database.transaction("rw", database.users, database.conversations, async () => {
          await database.conversations.bulkAdd(structuredMessages);
          await database.users.put(contact.export());
        });

        return structuredMessages;
      } catch (error) {
        // TODO, maybe try to resend, show disconnected, etc
        console.log(error);
        console.log(error.message);

        return null;
      }
    }
    return null;
  }

  return (
    <Loader isLoading={!ownNode}>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >

        <div className={classes.userItems}>
          <UserAvatar username={username} isOnline={isConnectedToPeers} showBadge showUsername />
          <IconButton
            aria-label="receivedRequests"
            color="primary"
            onClick={event => setAnchorEl(prevValue => (prevValue ? null : event.currentTarget))}
          >
            <Badge badgeContent={receivedRequests.length + sentRequests.length} color="primary">
              <GroupIcon />
            </Badge>
          </IconButton>

          <IconButton
            aria-label="receivedRequests"
            color="primary"
            onClick={() => call(ownNode, selectedContact)}
          >
            <CallIcon />
          </IconButton>
        </div>

        <video id="video" width="128" height="128" autoPlay />

        {/* <div className={classes.toolbar} /> */}
        <Divider />

        <ContactList
          contacts={contacts}
          setSelectedContact={handleSelectContact}
          handleAdd={() => setModalOpen(true)}
        />

      </Drawer>

      {/* TODO add something */}
      {
        selectedContact
          ? (
            <ContactPage
              selectedContact={selectedContact}
              sendText={sendTextMessage}
              sendFile={sendFile}
            />
          )
          : "TODO"
      }


      <AddContactDialog
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        handleSubmit={handleAddContact}
      />

      <RequestsPopper
        receivedRequests={receivedRequests}
        sentRequests={sentRequests}
        anchorEl={anchorEl}
        onClickAway={() => setAnchorEl(null)}
        handleAccept={handleAcceptRequest}
        handleReject={handleRejectRequest}
      />
    </Loader>
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Dashboard;
