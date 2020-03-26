import Dexie from "dexie";

const db = new Dexie("chatDatabase"); // TODO change name!

db.version(1).stores({
  friends: "username, age", // TODO
});

export default db;
