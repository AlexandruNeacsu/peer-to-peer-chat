import React, { useEffect, useState } from "react";
import ListItem from "@material-ui/core/ListItem";
import database from "../../../Database";
import UserAvatar from "../../Components/UserAvatar";


export default function ContactList({ friends, setFriends}) {
  // TODO: online status
  return friends.map(({ username, avatar }) => (
    <ListItem button key={username}>
      <UserAvatar username={username} image={avatar} />
    </ListItem>
  ));
}
