import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import GroupIcon from "@material-ui/icons/Group";
import CallIcon from "@material-ui/icons/Call";
import VideoCallIcon from "@material-ui/icons/VideoCall";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import SettingsIcon from "@material-ui/icons/Settings";
import Badge from "@material-ui/core/Badge";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import RequestsPopper from "./Popovers/RequestsPopper";
import ContactOptionsPopover from "./Popovers/ContactOptionsPopover";
import SettingsPopover from "./Popovers/SettingsPopover";

const drawerWidth = 280;

const useStyles = makeStyles(theme => ({
  contentRoot: {
    display: "flex",
    flexGrow: 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  toolbar: theme.mixins.toolbar,
  toolbarItems: {
    display: "flex",
    flexGrow: 1,
  },
  toolbarItemsLeft: {
    flexGrow: 1,
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    backgroundColor: theme.palette.background.paper,
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
  },
  userItems: {
    ...theme.mixins.toolbar,
    display: "flex",
  },
  userAvatar: {
    flexGrow: 1,
  },
}));


function Sidebar({
  username,
  isOnline,
  contacts,
  selectedContact,
  handleSelectContact,
  onAddContact,
  receivedRequests,
  sentRequests,
  handleAcceptRequest,
  handleRejectRequest,
  onCall,
  hasCamera,
  children,
}) {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  const [popOverOpen, setPopOverOpen] = useState("");

  // TODO: show a message or something if not connected to a peer

  const handlePopoverOpen = (popOver) => (event) => {
    setAnchorEl(event.currentTarget);
    setPopOverOpen(popOver);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopOverOpen("");
  };

  return (
    <div id="sidebar" className={classes.contentRoot}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          {
            selectedContact && (
              <div className={classes.toolbarItems}>
                <div className={classes.toolbarItemsLeft}>
                  <UserAvatar
                    showUsername
                    username={selectedContact.username}
                    showBadge
                    isOnline={selectedContact.isConnected}
                    image={selectedContact.avatar}
                  />
                </div>

                <div>
                  <IconButton color="primary" disabled={!selectedContact.isConnected} onClick={() => onCall(false)}>
                    <CallIcon />
                  </IconButton>
                  {
                    hasCamera
                      ? (
                        <IconButton color="primary" disabled={!selectedContact.isConnected} onClick={() => onCall(true)}>
                          <VideoCallIcon />
                        </IconButton>
                      )
                      : null
                  }
                  <IconButton
                    onClick={handlePopoverOpen("options")}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </div>
              </div>
            )
          }
          <Divider />

        </Toolbar>
      </AppBar>

      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >

        <div className={classes.userItems}>
          <UserAvatar className={classes.userAvatar} username={username} isOnline={isOnline} showBadge showUsername />
          <IconButton
            aria-label="receivedRequests"
            onClick={handlePopoverOpen("requests")}
          >
            <Badge badgeContent={receivedRequests.length + sentRequests.length} color="primary">
              <GroupIcon />
            </Badge>
          </IconButton>
          <IconButton
            aria-label="settings"
            onClick={handlePopoverOpen("settings")}
          >
            <SettingsIcon />
          </IconButton>
        </div>

        <Divider />

        <ContactList
          contacts={contacts}
          selectedContact={selectedContact}
          setSelectedContact={handleSelectContact}
          onAdd={onAddContact}
        />

        <RequestsPopper
          open={popOverOpen === "requests"}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          receivedRequests={receivedRequests}
          sentRequests={sentRequests}
          handleAccept={handleAcceptRequest}
          handleReject={handleRejectRequest}
        />

        <ContactOptionsPopover
          open={popOverOpen === "options"}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          selectedContact={selectedContact}
        />

        <SettingsPopover
          open={popOverOpen === "settings"}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
        />


      </Drawer>

      {children}

    </div>
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Sidebar;
