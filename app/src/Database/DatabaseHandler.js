import Dexie from "dexie";
import encrypt from "dexie-encrypted";
import User from "./Schemas/User";
import Message from "./Schemas/Message";
import Encryption from "./Encryption";
import DatabaseNotInitializedError from "./Errors/DatabaseNotInitializedError";
import DatabaseClosedIncorrectlyError from "./Errors/DatabaseClosedIncorrectlyError";

const DATABASE_NAME = "chatDatabase"; // TODO change name!

/**
 * Dexie db instance
 * @type {Dexie}
 * @private
 */
let _database = null;


// TODO: Test & refactor
const DatabaseHandler = {
  /** Initialize the DexieDB with all necessary settings
   * TODO: change name to openDatabase?
   * TODO indexed db not working in private mode, do something!(show message, etc)
   * @param password
   * @returns {Promise<void>}
   */
  initDatabase: async (password) => {
    // set the key and provide a configuration of how to encrypt at a table level.
    let symmetricKey;

    // TLDR: Get the key if the DB exists, else generate it
    // TODO: is localstorage ok?

    if (await Dexie.exists(DATABASE_NAME)) {
      const encryptedSymmetricKey = localStorage.getItem("encryptedSymmetricKey");
      const iv = localStorage.getItem("iv");

      symmetricKey = Encryption.decryptKey(encryptedSymmetricKey, iv, password);
    } else {
      localStorage.clear();

      // generate a random key to encrypt DB then encrypt the key with the user password
      // we do this in case the user changes the password so we don't have to re-encrypt the whole db
      symmetricKey = await Encryption.generateRandomKeyBuffer();

      // encrypt the symmetric key with the password
      const { encryptedSymmetricKey, iv } = await Encryption.encryptKey(symmetricKey, password);

      // store them for later decryption of db
      localStorage.setItem("encryptedSymmetricKey", encryptedSymmetricKey);
      localStorage.setItem("iv", iv);
    }

    _database = new Dexie(DATABASE_NAME);


    encrypt(_database, symmetricKey, {
      friends: encrypt.NON_INDEXED_FIELDS,
      messages: encrypt.NON_INDEXED_FIELDS,
    });


    // stores and indexes
    _database.version(1).stores({
      // userData: ",",
      friends: "++id, username", // TODO refine, and move to the same folder as the class
      messages: "++id, ownerId", // TODO
    });

    // Dexie does not wait for all hooks to be subscribed (bug?).
    await _database.open();

    _database.friends.mapToClass(User);
    _database.messages.mapToClass(Message);
  },

  closeDatabase: () => {
    if (_database) {
      _database.close();

      _database = undefined;
    }
  },

  /**
   * Retuns database instance.
   * @returns {Dexie}
   */
  getDatabase: () => {
    if (!_database) throw new DatabaseNotInitializedError("You have to first initalize the database!");
    else if (!_database.isOpen()) throw new DatabaseClosedIncorrectlyError("Database has been closed incorrectly!");

    return _database;
  },

  DATABASE_NAME,
};

export default DatabaseHandler;
