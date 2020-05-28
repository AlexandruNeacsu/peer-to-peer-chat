import React, { useState } from "react";
import { useSnackbar } from 'notistack';
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
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { t } from "react-i18nify";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import UserAvatar from "../../../Components/UserAvatar";

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

const RequestsPopover = ({ open, anchorEl, onClose, receivedRequests, sentRequests, onAccept, onReject, onDelete }) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [isPopoverOpen, setIsPopoverOpen] = useState(null);
  const [buttonEl, setButtonEl] = useState(null);


  const handlePopoverClose = () => {
    setIsPopoverOpen(null);
    setButtonEl(null);
  };

  const handleClick = (event, id, username) => {
    setButtonEl(event.currentTarget);
    setIsPopoverOpen({ id, username });
  };

  const handleAccept = async (id, username) => {
    try {
      onClose();
      await onAccept(id, username);

      enqueueSnackbar(t("Requests.AcceptSuccess"), { variant: "success" });
    } catch (error) {
      // TODO
      console.log(error);

      enqueueSnackbar(t("Requests.Errors.NotOnline"), { variant: "error" });
    }
  };

  const handleReject = async (id, username) => {
    try {
      onClose();
      await onReject(id, username);

      enqueueSnackbar(t("Requests.RejectSuccess"), { variant: "success" });
    } catch (error) {
      // TODO
      console.log(error);

      enqueueSnackbar(t("Requests.Errors.RejectError"), { variant: "error" });
    }
  };

  const handleDelete = async id => {
    try {
      onClose();
      await onDelete(id);

      enqueueSnackbar(t("Requests.DeleteSuccess"), { variant: "success" });
    } catch (error) {
      // TODO
      enqueueSnackbar(t("Requests.Errors.DeleteError"), { variant: "error" });
    }
  };

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
          <ListSubheader>{t("Requests.Received")}</ListSubheader>
          {receivedRequests.map(({ id, username, avatar }) => (
            <>
              <ListItem key={id}>
                <ListItemAvatar>
                  <UserAvatar
                    username={username.toUpperCase()}
                    image={avatar}
                  />
                </ListItemAvatar>

                <ListItemText
                  primary={username}
                  primaryTypographyProps={{
                    variant: "h6",
                    noWrap: true,
                  }}
                  secondary={id}
                  secondaryTypographyProps={{
                    noWrap: true,
                  }}
                />

                <ListItemSecondaryAction>
                  <IconButton
                    color="primary"
                    edge="end"
                    aria-label="options"
                    onClick={(event) => handleClick(event, id, username)}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider component="li" />

            </>
          ))}

          <ListSubheader>{t("Requests.Sent")}</ListSubheader>

          {sentRequests.map(({ username, id, avatar }, index) => (
            <>

              <ListItem key={id}>
                <ListItemAvatar>
                  <UserAvatar
                    username={username.toUpperCase()}
                    image={avatar}
                  />
                </ListItemAvatar>

                <ListItemText
                  primary={username}
                  primaryTypographyProps={{
                    variant: "h6",
                    noWrap: true,
                  }}
                  secondary={id}
                  secondaryTypographyProps={{
                    noWrap: true,
                  }}
                />

                <ListItemSecondaryAction>
                  <IconButton color="primary" edge="end" aria-label="delete" onClick={() => handleDelete(id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>

              </ListItem>

              {
                index !== sentRequests.length - 1 && (
                  <Divider component="li" />
                )
              }
            </>
          ))}

        </List>
      </Paper>


      <OptionsPopover
        open={isPopoverOpen}
        classes={classes}
        anchorEl={buttonEl}
        onClose={handlePopoverClose}
        onAccept={() => handleAccept(isPopoverOpen.id, isPopoverOpen.username)}
        onReject={() => handleReject(isPopoverOpen.id, isPopoverOpen.username)}
      />
    </Popover>
  );
};


const OptionsPopover = ({ open, classes, anchorEl, onClose, onAccept, onReject }) => (
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
        <ListItem button className={classes.option} onClick={onReject}>
          <ListItemIcon color="primary">
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary={t("Requests.Reject")} />
        </ListItem>
        <ListItem button className={classes.option} onClick={onAccept}>
          <ListItemIcon>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary={t("Requests.Accept")} />
        </ListItem>
      </List>
    </Paper>
  </Popover>
);

export default RequestsPopover;
