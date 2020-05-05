import React from "react";
import Popper from "@material-ui/core/Popper";
import Fade from "@material-ui/core/Fade";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import ListSubheader from "@material-ui/core/ListSubheader";
import Paper from "@material-ui/core/Paper";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import DeleteIcon from '@material-ui/icons/Delete';


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
  list: {
    // width: '100%',TODO
    // maxWidth: 360,
    // backgroundColor: theme.palette.background.paper,
    // position: 'relative',
    // overflow: 'auto',
    // maxHeight: 300,
  },
}));

const NotificationsPopper = ({ anchorEl, onClickAway, receivedRequests, sentRequests, handleAccept, handleReject }) => {
  const classes = useStyles();

  return (
    <Popper
      open={!!anchorEl}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      className={classes.popper}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps}>
          <ClickAwayListener onClickAway={onClickAway}>
            <Paper>
              <List className={classes.list}>
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
          </ClickAwayListener>
        </Fade>
      )}
    </Popper>
  );
};

export default NotificationsPopper;
