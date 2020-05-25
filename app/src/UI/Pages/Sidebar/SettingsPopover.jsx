import React from "react";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import LanguagePicker from "../../Components/LanguagePicker";


const useStyles = makeStyles(() => ({
  option: {
    minWidth: "200px",
  },
}));

const ContactOptionsPopover = ({ open, anchorEl, onClose }) => {
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
    >
      <Paper elevation={4}>
        <List>
          <ListItem className={classes.option}>
              <LanguagePicker />
          </ListItem>
        </List>
      </Paper>
    </Popover>
  );
};

export default ContactOptionsPopover;
