import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import GroupIcon from "@material-ui/icons/Group";
import CallIcon from "@material-ui/icons/Call";
import Badge from "@material-ui/core/Badge";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import RequestsPopper from "./RequestsPopper";

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
  },
  userItems: {
    ...theme.mixins.toolbar,
    display: "flex",
    justifyContent: "space-between",
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
  children,
}) {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  // TODO: show a message or something if not connected to a peer

  return (
    <div className={classes.contentRoot}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          {
            !selectedContact ? (
              <Typography variant="h6" noWrap>
                Permanent drawer
              </Typography>
            ) : (
              <div className={classes.toolbarItems}>
                <div className={classes.toolbarItemsLeft}>
                  <UserAvatar username={selectedContact.username} image={selectedContact.avatar} showUsername />
                </div>

                <div>
                  <IconButton>
                    <CallIcon />
                  </IconButton>
                </div>
              </div>
            )
          }
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
          <UserAvatar username={username} isOnline={isOnline} showBadge showUsername />
          <IconButton
            aria-label="receivedRequests"
            onClick={event => setAnchorEl(prevValue => (prevValue ? null : event.currentTarget))}
          >
            <Badge badgeContent={receivedRequests.length + sentRequests.length} color="primary">
              <GroupIcon />
            </Badge>
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
          receivedRequests={receivedRequests}
          sentRequests={sentRequests}
          anchorEl={anchorEl}
          onClickAway={() => setAnchorEl(null)}
          handleAccept={handleAcceptRequest}
          handleReject={handleRejectRequest}
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
