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
import ContactList from './ContactList';


const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  toolbar: theme.mixins.toolbar,
}));

export default function Sidebar() {
  const classes = useStyles();

  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <ListItem button>
        <ListItemIcon> <InboxIcon /></ListItemIcon>
        <ListItemText primary={"Add friend"} />
      </ListItem>

      {/* TODO incarca optiuni dupa ce user a scris cateva litere...  */}
      <Autocomplete
        id="free-solo-demo"
        freeSolo
        options={["asfas", "asfasf", "asfasfaf"]}
        renderInput={params => (
          <TextField {...params} label="freeSolo" margin="normal" variant="outlined" />
        )}
      />

      {/* <div className={classes.toolbar} /> */}
      <Divider />

      <ContactList />

    </Drawer >
  );
}