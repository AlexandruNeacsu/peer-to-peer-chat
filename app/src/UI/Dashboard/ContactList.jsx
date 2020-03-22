import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { ListSubheader } from '@material-ui/core';


const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
}));

export default function ContactList() {
  const classes = useStyles();

  return (
    <List>
      <ListSubheader>{`Friends`}</ListSubheader>
      {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
        <>
          <ListItem button key={text}>
            <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        </>
      ))}
    </List>
  );
}