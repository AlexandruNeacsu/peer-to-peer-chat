import React from "react";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import InfoIcon from "@material-ui/icons/Info";
import ClearAllIcon from "@material-ui/icons/ClearAll";
import DeleteIcon from "@material-ui/icons/Delete";
import { t } from "react-i18nify";


const useStyles = makeStyles(theme => ({
  option: {
    minWidth: "200px",
  },
}));

const ContactOptionsPopover = ({ open, anchorEl, selectedContact, onClose }) => {
  const classes = useStyles();

  const handleInfo = () => {
    // TODO
  };

  const handleClear = selectedContact ? selectedContact.clearConversation : null;

  const handleDelete = selectedContact ? selectedContact.delete : null;

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
    >
      <Paper elevation={4}>
        <List>
          <ListItem button className={classes.option}>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText>{t("Options.Info")}</ListItemText>
          </ListItem>
          <ListItem button className={classes.option} onClick={handleClear}>
            <ListItemIcon>
              <ClearAllIcon />
            </ListItemIcon>
            <ListItemText>{t("Options.Clear")}</ListItemText>
          </ListItem>
          <ListItem button className={classes.option} onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText>{t("Options.Delete")}</ListItemText>
          </ListItem>
        </List>
      </Paper>
    </Popover>
  );
};

export default ContactOptionsPopover;
