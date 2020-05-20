import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import CallIcon from "@material-ui/icons/Call";
import CallEndIcon from "@material-ui/icons/CallEnd";
import { makeStyles } from "@material-ui/core/styles";
import { t } from "react-i18nify";
import IconButton from "@material-ui/core/IconButton";
import UserAvatar from "../../Components/UserAvatar";

const useStyles = makeStyles(() => ({
  paper: {
    width: "80%",
    maxHeight: 435,
  },
}));


const CallAlert = ({ contact, open, onClose }) => {
  const classes = useStyles();

  return (
    <Dialog
      id="ringtone-menu"
      aria-labelledby="confirmation-dialog-title"
      maxWidth="xs"
      open={open}
      keepMounted
      disableBackdropClick
      disableEscapeKeyDown
      onClose={onClose}
      classes={{
        paper: classes.paper,
      }}
    >
      <DialogTitle id="confirmation-dialog-title">{t("Call.CallTitle", { username: contact.username })}</DialogTitle>
      <DialogContent dividers>
        <UserAvatar image={contact.avatar} username={contact.username} showUsername />
      </DialogContent>

      <DialogActions>
        <IconButton
          autoFocus
          onClick={() => onClose(true)}
          color="primary"
          aria-label={t("Call.AcceptTODO")}
        >
          <CallIcon />
        </IconButton>
        <IconButton
          onClick={() => onClose(false)}
          color="primary"
          aria-label={t("Call.RefuseTODO")}
        >
          <CallEndIcon />
        </IconButton>
      </DialogActions>

    </Dialog>
  );
};

export default CallAlert;
