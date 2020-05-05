/* eslint-disable no-await-in-loop */
import React, { useEffect, useState } from "react";
import axios from "axios";
import PeerId from "peer-id";
import pipe from "it-pipe";
import lp from "it-length-prefixed";
import { t } from "react-i18nify";
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
import AddFriendDialog from "./AddFriendDialog";
import RequestsPopper from "./RequestsPopper";
import DatabaseHandler from "../../../Database";
import createNode, { receiveData, sendData } from "../../../ConnectionV2/Bundle";
import Loader from "../../Components/Loader";

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
  friendAddButton: {
    float: "right",
  },
}));


function Dashboard() {
  const classes = useStyles();

  // TODO: rename friends to contacts?

  // TODO clean this mess
  const [username] = useState(localStorage.getItem("username"));
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToPeer, setIsConnectedToPeer] = useState(false);

  const [ownNode, setOwnNode] = useState(null);

  const handleNetworkJoin = () => setIsConnectedToPeer(true);

  /**
   *
   * @param {string} B58StringId
   * @param {string} friendUsername
   * @return {Promise<void>}
   */
  async function acceptRequest(B58StringId, friendUsername) {
    const database = DatabaseHandler.getDatabase();

    await database.transaction("rw", database.requests, database.users, async () => {
      await database.requests.delete(B58StringId);

      await database.users.add({ id: B58StringId, username: friendUsername });
    });
  }

  /**
   *
   * @param {string} B58StringId
   * @param {string} friendUsername
   * @return {Promise<void>}
   */
  useEffect(() => {
    async function handleFriendRequest({ connection, stream }) {
      // TODO: is this concurrent safe?
      const id = connection.remotePeer.toB58String();

      try {
        const messages = await receiveData(stream.source);

        const message = messages.shift();

        if (message === "ADD") {
          const request = { id, username: messages.shift() };

          const database = DatabaseHandler.getDatabase();
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
            setFriends(prevFriends => ([
              ...prevFriends,
              request,
            ]));
          }
        } else if (message === "ACCEPTED") {
          // response to a friend request we sent at another moment in time
          const database = DatabaseHandler.getDatabase();

          await database.transaction("rw", database.requests, database.users, async () => {
            const request = await database.requests.get({ id });

            if (request && request.sent) {
              // we sent a request and it wasn't accepted
              // just accept the request
              await acceptRequest(id, request.username);

              setFriends(prevFriends => ([
                ...prevFriends,
                { id, username: request.username },
              ]));

              setSentRequests(prevRequests => prevRequests.filter(e => e.id !== id));

              await sendData(stream.sink, ["OK"]);
            } else {
              // TODO: sent not registered message
            }
          });
        }
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }

    async function getOwnNode() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        const { peerIdJSON } = await database.users.get({ id: userId });

        const peerId = await PeerId.createFromJSON(peerIdJSON);
        const node = await createNode(peerId);

        node.on("peer:connect", async (peerInfo) => {
          // this should be done automatically by libp2p
          // but it's not
          await node._dht._add(peerInfo);
          handleNetworkJoin();
        });

        node.handle("/add/1.0.0", handleFriendRequest); // TODO gestion this better
        await node.start();

        setOwnNode(node);
        setIsLoading(false);
      } catch (error) {
        // todo: catch DatabaseHandler.getDatabase() errors
        console.error(error);
        console.error(error.message);
      }
    }

    getOwnNode();
  }, []);


  const handleAddFriend = async (friendUsername) => {
    // TODO redial for peers we have the id but didn't found!
    try {
      // get the associated peerId
      const response = await axios.get(`http://localhost:8080/username/${friendUsername}`); // TODO: handle not found, etc
      const { peerId: B58StringId } = response.data;
      const friend = { id: B58StringId, username: friendUsername };

      const database = DatabaseHandler.getDatabase();
      const isInDatabase = await database.requests.get({ id: friend.id });

      const peerId = PeerId.createFromB58String(friend.id);

      const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      // try to dial
      const { stream } = await ownNode.dialProtocol(info, "/add/1.0.0");

      /*
      TODO: what to do if peer is not found
      how do we handle accepting the friend request locally
      and then send our response to the remote user when connection is available
      */

      if (isInDatabase && !isInDatabase.sent) {
        // we received a request and we haven't accepted it
        await acceptRequest(friend.id, friendUsername);

        setFriends(prevFriends => ([...prevFriends, friend]));

        // send our response
        await sendData(stream.sink, ["ACCEPTED"]);

        const messages = await receiveData(stream.source);
        const message = messages.shift();

        if (message === "OK") {
          // TODO set snackbar to succesful

          console.log("OK");
        } else {
          // TODO crash, burn
        }

        // TODO: snackbar that it was accepted?
      } else if (!isInDatabase) {
        await sendData(stream.sink, ["ADD", username]);

        const response = await receiveData(stream.source);
        const message = response.shift();

        if (message === "REGISTERED") {
          // TODO set snackbar to succesful

          await database.requests.add({ ...friend, sent: true });
          setSentRequests(prevValues => ([...prevValues, friend]));
        } else if (message === "ACCEPTED") {
          await database.users.add(friend);

          setFriends(prevFriends => ([...prevFriends, friend]));
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
        // TODO id not found, friend not reached, etc...
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        console.log(error);
      }
    }
  };

  async function handleAcceptRequest(B58StringId, friendUsername) {
    try {
      await acceptRequest(B58StringId, friendUsername);

      // TODO: resend accept when peer is online
      const peerId = PeerId.createFromB58String(B58StringId);

      const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      // try to dial
      const { stream } = await ownNode.dialProtocol(info, "/add/1.0.0");
      await sendData(stream.sink, ["ACCEPTED"]); // TODO what if they didn't receive the message?

      // TODO use user object
      setFriends(prevFriends => ([...prevFriends, { id: B58StringId, username: friendUsername }]));
      setReceivedRequests(prevRequsts => prevRequsts.filter(req => req.id !== B58StringId));
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  }

  useEffect(() => {
    async function getDatabaseData() {
      try {
        const database = DatabaseHandler.getDatabase();

        const userId = localStorage.getItem("id");
        /** @type {Array<User>} */
        const dbFriends = await database.users.where("id").notEqual(userId).toArray();

        // TODO: can we make this work with Promise.all? look if the singleton can handle it
        // eslint-disable-next-line no-restricted-syntax

        for (const friend of dbFriends) {
          const peerId = PeerId.createFromB58String(friend.id);

          if (isConnectedToPeer) {
            friend.peerInfo = await ownNode.peerRouting.findPeer(peerId);

            // TODO dial to get stream! crash when no connections
          }
        }


        /** @type {Object[]} */
        const requests = await database.requests.toArray();

        setFriends(dbFriends);
        setReceivedRequests(requests.filter(request => !request.sent));
        setSentRequests(requests.filter(request => request.sent));
      } catch (error) {
        console.log(error);
        console.log(error.message);
        // TODO set error snackbar!, peer not found, node not created...
      }
    }

    if (ownNode !== null) {
      getDatabaseData();
    } else {
      // TODO: show a message or something
      // allow user to view past messages
    }
  }, [ownNode, isConnectedToPeer]);

  console.log(friends);

  return (
    <Loader isLoading={isLoading}>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >

        <div className={classes.userItems}>
          <UserAvatar username={username} />
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
            {t("Contacts.AddFriend")}
            <IconButton className={classes.friendAddButton} onClick={() => setModalOpen(true)}>
              <PersonAddIcon />
            </IconButton>
          </ListSubheader>

          <ContactList
            setSelectedFriend={setSelectedFriend}
            friends={friends}
          />
        </List>

      </Drawer>

      {/* TODO add something */}
      {selectedFriend ? <ContactPage selectedFriend={selectedFriend} /> : "TODO"}


      <AddFriendDialog
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        handleSubmit={handleAddFriend}
      />

      <RequestsPopper
        receivedRequests={receivedRequests}
        sentRequests={sentRequests}
        anchorEl={anchorEl}
        onClickAway={() => setAnchorEl(null)}
        handleAccept={handleAcceptRequest}
      />
    </Loader>
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Dashboard;
