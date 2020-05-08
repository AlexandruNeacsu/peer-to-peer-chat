import React from "react";
import ListItem from "@material-ui/core/ListItem";
import UserAvatar from "../../Components/UserAvatar";

/**
 *
 * @param {User[]} contacts
 * @param {function} setSelectedContact
 */
export default function ContactList({ contacts, setSelectedContact }) {
  // TODO: online status
  return contacts.map(contact => (
    <ListItem button key={contact.username} onClick={() => setSelectedContact(contact)}>
      <UserAvatar username={contact.username} image={contact.avatar} showBadge isOnline={contact.isConnected} />
    </ListItem>
  ));
}
