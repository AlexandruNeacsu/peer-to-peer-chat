import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import GroupIcon from "@material-ui/icons/Group";
import Badge from "@material-ui/core/Badge";
import UserAvatar from "../../Components/UserAvatar";
import ContactList from "./ContactList";
import RequestsPopper from "./RequestsPopper";

const drawerWidth = 280;

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


function Sidebar({
  username,
  isOnline,
  contacts,
  handleSelectContact,
  onAddContact,
  receivedRequests,
  sentRequests,
  handleAcceptRequest,
  handleRejectRequest,
}) {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  // TODO: show a message or something if not connected to a peer

  return (
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
          color="primary"
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
  );
}

// TODO
// Dashboard.propTypes = {
//   signalSocket: PropTypes.instanceOf()
// };

export default Sidebar;
