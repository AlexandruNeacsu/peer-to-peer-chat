import React from "react";
import ListItem from "@material-ui/core/ListItem";
import UserAvatar from "../../Components/UserAvatar";


export default function ContactList({ contacts, setSelectedFriend}) {
  // TODO: online status
  return contacts.map(({ username, avatar }) => (
    <ListItem button key={username}>
      <UserAvatar username={username} image={avatar} />
    </ListItem>
  ));
}
