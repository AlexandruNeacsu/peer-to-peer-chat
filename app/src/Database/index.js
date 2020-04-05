import Dexie from "dexie";
import User from "./Schemas/User";
import Message from "./Schemas/Message";

const database = new Dexie("chatDatabase"); // TODO change name!

// TODO indexed db not working in private mode, do something!(show message, etc)

// stores and indexes
database.version(1).stores({
  friends: "++id, username", // TODO refine, and move to the same folder as the class
  messages: "++id, ownerId, datetime, text", // TODO
});

database.friends.mapToClass(User);
database.messages.mapToClass(Message);


export default database;
