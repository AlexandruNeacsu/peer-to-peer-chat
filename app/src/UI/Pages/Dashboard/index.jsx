/* eslint-disable no-await-in-loop */
import React, { useEffect, useState } from "react";
import axios from "axios";
import PeerId from "peer-id";
import { t } from "react-i18nify";
import moment from "moment/moment";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import { ListSubheader } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import Badge from "@material-ui/core/Badge";
import GroupIcon from "@material-ui/icons/Group";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import ContactPage from "./ContactPage";
import AddContactDialog from "./AddContactDialog";
import RequestsPopper from "./RequestsPopper";
import DatabaseHandler from "../../../Database";
import createNode, { receiveData, sendData } from "../../../ConnectionV2/Bundle";
import Loader from "../../Components/Loader";
import User from "../../../Database/Schemas/User";

const drawerWidth = 240;

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
  search: {
    padding: theme.spacing(1),
  },
  contactAddButton: {
    float: "right",
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

function Dashboard() {
  const classes = useStyles();


  // TODO clean this mess
  const [username] = useState(localStorage.getItem("username"));
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  // TODO: show a message or something if not connected to a peer
  const [isConnectedToPeers, setIsConnectedToPeer] = useState(false);
  const [ownNode, setOwnNode] = useState(null);


  /** INITIALIZE NODE */
  useEffect(() => {
    function updateContact(contactId, fields) {
      setContacts(previousContacts => {
        const contactIndex = previousContacts.findIndex(e => e.id === contactId);

        // node is a contact
        if (contactIndex !== -1) {
          const newContacts = [...previousContacts];

          /** @type {User} */
          const connectedContact = newContacts[contactIndex];

          Object.assign(connectedContact, fields);

          // don't use the same reference
          return newContacts;
        }

        return previousContacts;
      });
    }

    /**
     *
     * @param {PeerInfo} contactPeerInfo
     * @param {boolean} newConnectionStatus
     */
    function updateContactConnectionStatus(contactPeerInfo, newConnectionStatus) {
      if (newConnectionStatus) {
        setIsConnectedToPeer(true);
      }

      updateContact(
        contactPeerInfo.id.toB58String(),
        {
          isConnected: newConnectionStatus,
          peerInfo: contactPeerInfo,
        },
      );
    }

    async function handlePeerConnect(node, peerInfo) {
      // this should be done automatically by libp2p
      // but it's not
      await node._dht._add(peerInfo);

      updateContactConnectionStatus(peerInfo, true);
    }

    async function handleAddProtocol({ connection, stream }) {
      // TODO: is this concurrent safe?
      // TODO: do we need to close the connection? how about on a refuse? or after final response?
      const id = connection.remotePeer.toB58String();

      try {
        const database = DatabaseHandler.getDatabase();

        const messages = await receiveData(stream.source);
        const message = messages.shift();

        switch (message) {
          case "ADD": {
            const request = { id, username: messages.shift() };

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
              setContacts(prevContacts => ([
                ...prevContacts,
                request,
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
      console.log("new chat connection");
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
            // TODO: use message class
            // TODO: parse the message to ensure structure
            const messages = data.map(message => JSON.parse(message))
              .map(message => ({
                // TODO: handle images, maps, etc...
                ...message,
                receivedDate: moment().toDate(),
                ownerId: user.id,
                status: "received", // TODO move to an enum
              }));

            console.log("saving messages");
            console.log(messages);

            let unread = 0;

            await database.transaction("rw", database.messages, async () => {
              await database.messages.bulkAdd(messages);

              unread = await database.messages.where("status").equals("received").count();
            });


            updateContact(
              user.id,
              {
                chatItem: {
                  // avatar={'https://facebook.github.io/react/img/logo.svg'}
                  // alt={'Reactjs'}
                  title: user.username,
                  subtitle: messages[messages.length - 1].data,
                  date: messages[messages.length - 1].receivedDate,
                  unread,
                },
              },
            );
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

    async function getOwnNode() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        const { peerIdJSON } = await database.users.get({ id: userId });

        const peerId = await PeerId.createFromJSON(peerIdJSON);
        const node = await createNode(peerId);

        node.on("peer:connect", (peerInfo) => handlePeerConnect(node, peerInfo));
        node.on("peer:disconnect", (peerInfo) => updateContactConnectionStatus(peerInfo, false));
        node.handle("/add/1.0.0", handleAddProtocol); // TODO gestion this better
        node.handle("/chat/1.0.0", (connectionData) => handleChatProtocol(node, connectionData));

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
  }, [ownNode]);

  /** LOAD DATABASE DATA */
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

  const handleAddContact = async (contactUsername) => {
    // TODO redial for peers we have the id but didn't found!
    try {
      // get the associated peerId
      const response = await axios.get(`http://localhost:8080/username/${contactUsername}`); // TODO: handle not found, etc
      const { peerId: B58StringId } = response.data;
      const contact = { id: B58StringId, username: contactUsername };

      const database = DatabaseHandler.getDatabase();
      const isInDatabase = await database.requests.get({ id: contact.id });

      const peerId = PeerId.createFromB58String(contact.id);

      const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      // try to dial
      const { stream } = await ownNode.dialProtocol(info, "/add/1.0.0");

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
        const message = messages.shift();

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
        const message = messages.shift();

        if (message === "REGISTERED") {
          // TODO set snackbar to succesful

          await database.requests.add({ ...contact, sent: true });
          setSentRequests(prevValues => ([...prevValues, contact]));
        } else if (message === "ACCEPTED") {
          await database.users.add(contact);

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

      // TODO use user object
      setContacts(prevContacts => ([...prevContacts, { id: B58StringId, username: contactUsername }]));
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

  /**
   *
   * @param {String }id
   * @param {String} message
   * @return {Promise<void>}
   */
  async function sendTextMessage(id, message) {
    if (message) {
      try {
        const structuredMessage = {
          type: "TEXT",
          data: message,
          sentDate: moment().toDate(),
        };

        const peerId = PeerId.createFromB58String(id);
        // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
        const { stream } = await ownNode.dialProtocol(peerId, "/chat/1.0.0"); // todo: works withouth info?

        const data = JSON.stringify(structuredMessage);

        await sendData(stream.sink, [data]);
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }
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
          <UserAvatar username={username} showBadge isOnline={isConnectedToPeers} />
          <IconButton
            aria-label="receivedRequests"
            color="primary"
            onClick={event => setAnchorEl(prevValue => (prevValue ? null : event.currentTarget))}
          >
            <Badge badgeContent={receivedRequests.length + sentRequests.length} color="primary">
              <GroupIcon />
            </Badge>
          </IconButton>
        </div>

        {/* TODO incarca optiuni dupa ce user a scris cateva litere...  */}
        <Autocomplete
          className={classes.search}
          id="free-solo-demo"
          freeSolo
          options={["asfas", "asfasf", "asfasfaf"]}
          renderInput={params => (
            <TextField {...params} label="freeSolo" margin="dense" />
          )}
        />

        {/* <div className={classes.toolbar} /> */}
        <Divider />

        <List>
          <ListSubheader>
            {t("Contacts.AddContact")}
            <IconButton className={classes.contactAddButton} onClick={() => setModalOpen(true)}>
              <PersonAddIcon />
            </IconButton>
          </ListSubheader>

          <ContactList
            setSelectedContact={setSelectedContact}
            contacts={contacts}
          />
        </List>

      </Drawer>

      {/* TODO add something */}
      {selectedContact ? <ContactPage selectedContact={selectedContact} sendTextMessage={sendTextMessage} /> : "TODO"}


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
