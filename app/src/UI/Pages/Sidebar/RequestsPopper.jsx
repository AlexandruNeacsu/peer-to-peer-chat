import React from "react";
import Popover from "@material-ui/core/Popover";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import ListSubheader from "@material-ui/core/ListSubheader";
import Paper from "@material-ui/core/Paper";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import DeleteIcon from "@material-ui/icons/Delete";


const useStyles = makeStyles(theme => ({
  friendAddButton: {
    float: "right",
  },
  popper: {
    zIndex: theme.zIndex.drawer + 1,
  },
  popperContent: {
    padding: theme.spacing(2),
  },
}));

const NotificationsPopper = ({ open, anchorEl, onClose, receivedRequests, sentRequests, handleAccept, handleReject }) => {
  const classes = useStyles();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      className={classes.popper}
    >
      <Paper>
        <List>
          {/* TODO */}
          <ListSubheader>TODO: Received request</ListSubheader>
          {receivedRequests.map(({ id, username }, index) => (
            <>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={username}
                  secondary={id}
                />

                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="reject" onClick={() => handleReject(id, username)}>
                    <DeleteIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="add" onClick={() => handleAccept(id, username)}>
                    <PersonAddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider variant="inset" component="li" />
            </>
          ))}

          <ListSubheader>TODO: Sent request</ListSubheader>
          {sentRequests.map(({ username, id }, index) => (
            <>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={username}
                  secondary={id}
                />
              </ListItem>
              {index !== receivedRequests.length - 1 ? <Divider variant="inset" component="li" /> : null}
            </>
          ))}

        </List>
      </Paper>
    </Popover>
  );
};

export default NotificationsPopper;
