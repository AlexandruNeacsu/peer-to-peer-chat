import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import CallIcon from "@material-ui/icons/Call";
import VideoCallIcon from "@material-ui/icons/VideoCall";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import SettingsIcon from "@material-ui/icons/Settings";
import MenuIcon from "@material-ui/icons/Menu";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Hidden from "@material-ui/core/Hidden";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import RequestsPopper from "./Popovers/RequestsPopover";
import ContactOptionsPopover from "./Popovers/ContactOptionsPopover";
import SettingsPopover from "./Popovers/SettingsPopover";
import AvatarEditor from "../AvatarEditor";

const drawerWidth = 280;

const useStyles = makeStyles(theme => ({
  contentRoot: {
    display: "flex",
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: theme.palette.background.paper,
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    [theme.breakpoints.up("sm")]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
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
  handleDeleteRequest,
  onCall,
  hasCamera,
  avatar,
  setAvatar,
  children,
}) {
  const classes = useStyles();

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [popOverOpen, setPopOverOpen] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // TODO: show a message or something if not connected to a peer

  const handlePopoverOpen = (popOver) => (event) => {
    setAnchorEl(event.currentTarget);
    setPopOverOpen(popOver);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopOverOpen("");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(prevState => !prevState);
  };

  const handleAvatarEditorOpen = () => setIsEditingAvatar(true);

  const handleAvatarEditorClose = (newAvatar) => {
    setIsEditingAvatar(false);

    if (newAvatar) {
      setAvatar(newAvatar);
    }
  };

  const drawerChildren = (
    <>
      <div className={classes.userItems}>
        <UserAvatar
          className={classes.userAvatar}
          username={username}
          isOnline={isOnline}
          image={avatar}
          showBadge
          showUsername
          onClick={handleAvatarEditorOpen}
        />

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
        isOnline={isOnline}
        selectedContact={selectedContact}
        setSelectedContact={handleSelectContact}
        onAdd={onAddContact}
        onPopoverOpen={handlePopoverOpen("requests")}
        requestsCount={receivedRequests.length}
      />
    </>
  );

  return (
    <div id="sidebar" className={classes.contentRoot}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="primary"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>

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
                    isBlocked={selectedContact.isBlocked}
                  />
                </div>

                <div>
                  <IconButton
                    color="primary"
                    disabled={selectedContact.isBlocked || !selectedContact.isConnected}
                    onClick={() => onCall(false)}
                  >
                    <CallIcon />
                  </IconButton>
                  {
                    hasCamera
                      ? (
                        <IconButton
                          color="primary"
                          disabled={selectedContact.isBlocked || !selectedContact.isConnected}
                          onClick={() => onCall(true)}
                        >
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


      <Hidden smUp>
        <Drawer
          container={window ? () => window.document.body : undefined}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawerChildren}
        </Drawer>
      </Hidden>
      <Hidden xsDown>
        <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
          anchor="left"
        >
          {drawerChildren}
        </Drawer>
      </Hidden>


      {children}

      <RequestsPopper
        open={popOverOpen === "requests"}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        receivedRequests={receivedRequests}
        sentRequests={sentRequests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
        onDelete={handleDeleteRequest}
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

      <AvatarEditor
        isOpen={isEditingAvatar}
        onClose={handleAvatarEditorClose}
      />
    </div>
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Sidebar;
