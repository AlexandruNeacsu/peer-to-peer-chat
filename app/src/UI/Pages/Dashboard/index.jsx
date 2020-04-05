import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import { ListSubheader } from "@material-ui/core";
import { t } from "react-i18nify";
import IconButton from "@material-ui/core/IconButton";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import ContactPage from "./ContactPage";
import AddFriendDialog from "./AddFriendDialog";
import User from "../../../Database/Schemas/User";
import database from "../../../Database";


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
  search: {
    padding: theme.spacing(1),
  },
  friendAddButton: {
    float: "right",
  },
}));


function Dashboard({ signalSocket }) {
  const classes = useStyles();

  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    async function getFriendSocket(friend) {
      try {
        // eslint-disable-next-line no-param-reassign
        friend.socket = await signalSocket.findPeer(friend.username);
      } catch (e) {
        // TODO
      }
    }

    if (selectedFriend && !selectedFriend.socket) {
      getFriendSocket(selectedFriend);
    }
  }, [signalSocket, selectedFriend]);

  const [username] = useState(localStorage.getItem("username"));


  const [modalOpen, setModalOpen] = useState(false);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    async function getPeers() {
      await database.transaction("r", database.friends, async () => {
        try {
          const dbFriends = await database.friends.toArray();

          setFriends(dbFriends);
        } catch (e) {
          // TODO set error snackbar!
        }
      });
    }

    getPeers();
  }, []);

  async function handleAddFriend(friendUsername) {
    try {
      const socket = await signalSocket.findPeer(friendUsername);

      if (socket) {
        const newFriend = new User(null, friendUsername, null);

        newFriend.id = await database.friends.add({ username: friendUsername });

        setFriends([...friends, newFriend]);
      }
    } catch (e) {
      // TODO
    }
  }


  console.log(friends);

  return (
    <>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >

        <UserAvatar username={username} />

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
            setFriends={setFriends}
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
    </>
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Dashboard;
