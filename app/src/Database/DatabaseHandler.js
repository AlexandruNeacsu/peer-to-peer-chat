import Dexie from "dexie";
import encrypt from "dexie-encrypted";
import User from "./Schemas/User";
import Message from "./Schemas/Message";
import Encryption from "./Encryption";
import DatabaseNotInitializedError from "./Errors/DatabaseNotInitializedError";
import DatabaseClosedIncorrectlyError from "./Errors/DatabaseClosedIncorrectlyError";
import IncorrectPasswordError from "./Errors/IncorrectPasswordError";

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
    // TODO: is localstorage ok?, clean

    if (await Dexie.exists(DATABASE_NAME)) {
      try {
        const encryptedSymmetricKeyString = localStorage.getItem("encryptedSymmetricKey");
        const ivString = localStorage.getItem("iv");
        const saltString = localStorage.getItem("salt");

        const encryptedSymmetricKeyArray = JSON.parse(encryptedSymmetricKeyString);
        const ivArray = JSON.parse(ivString);
        const saltArray = JSON.parse(saltString);


        symmetricKey = await Encryption.decryptKey(
          new Uint8Array(encryptedSymmetricKeyArray),
          new Uint8Array(ivArray),
          password,
          new Uint8Array(saltArray),
        );
      } catch (error) {
        // TODO
        throw new IncorrectPasswordError("Password is not correct");
      }
    } else {
      localStorage.clear();

      // generate a random key to encrypt DB then encrypt the key with the user password
      // we do this in case the user changes the password so we don't have to re-encrypt the whole db
      symmetricKey = await Encryption.generateRandomKeyBuffer();

      // encrypt the symmetric key with the password
      const { salt, encryptedKey: encryptedSymmetricKey, iv } = await Encryption.encryptKey(symmetricKey, password);

      // store them for later decryption of db
      localStorage.setItem("salt", salt);
      localStorage.setItem("encryptedSymmetricKey", encryptedSymmetricKey);
      localStorage.setItem("iv", iv);
    }

    _database = new Dexie(DATABASE_NAME);


    encrypt(_database, symmetricKey, {
      users: encrypt.NON_INDEXED_FIELDS,
      conversations: encrypt.NON_INDEXED_FIELDS,
      requests: encrypt.NON_INDEXED_FIELDS,
    });

    // TODO: allow only one user with local === true

    // stores and indexes
    _database.version(2).stores({
      users: "id, username", // TODO refine, and move to the same folder as the class
      conversations: "++id, partnerId, date, status", // TODO
      requests: "id",
    });

    // Dexie does not wait for all hooks to be subscribed (bug?).
    await _database.open();

    _database.users.mapToClass(User);
    // _database.conversations.mapToClass(Message);

    _database.users.hook(
      "reading",
      ({ id, username, chatItem, peerIdJSON, isBlocked }) => new User(
        { id, username, database: _database, chatItem, peerIdJSON, isBlocked }
      ),
    );
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
