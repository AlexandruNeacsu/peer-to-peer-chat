import React from "react";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Paper from "@material-ui/core/Paper";
import LanguagePicker from "../../../Components/LanguagePicker";
import SignalServerPicker from "../../../Components/SignalServerPicker";


const ContactOptionsPopover = ({ open, anchorEl, onClose }) => (
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
        <ListItem>
          <LanguagePicker />
        </ListItem>
        <ListItem>
          <SignalServerPicker />
        </ListItem>
      </List>
    </Paper>
  </Popover>
);

export default ContactOptionsPopover;
