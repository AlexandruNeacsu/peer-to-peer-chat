import React from "react";
import ListItem from "@material-ui/core/ListItem";
import UserAvatar from "../../Components/UserAvatar";

import "react-chat-elements/dist/main.css";
// import ChatList from "./ChatList/ChatList";

import { ChatList } from "react-chat-elements-alex";

/**
 *
 * @param {User[]} contacts
 * @param {function} setSelectedContact
 */
export default function ContactList({ contacts, setSelectedContact }) {
  // TODO: online status

  return (
    <ChatList
      className="chat-list"
      onClick={({ contact }) => setSelectedContact(contact)}
      dataSource={contacts.map(contact => ({
        ...contact.chatItem,
        contact,
        customAvatar: (
          <UserAvatar username={contact.username} avatar={contact.avatar} showBadge isOnline={contact.isConnected} />
        ),
      }))}
    />
  );

  // return contacts.map(contact => (
  //   <ListItem button key={contact.username} onClick={() => setSelectedContact(contact)}>
  //     <UserAvatar username={contact.username} image={contact.avatar} showBadge isOnline={contact.isConnected} />
  //   </ListItem>
  // ));
}
