import PeerId from "peer-id";
import EventEmitter from "events";
import Dexie from "dexie";

class User extends EventEmitter {
  static EVENTS = {
    MESSAGE: "MESSAGE",
    CLEAR: "CLEAR",
    DELETE: "DELETE",
    BLOCK: "BLOCK"
  }


  /**
   * @param {String} id
   * @param {String }username
   * @param {Dexie} database
   * @param {{date: null, unread: number, subtitle: string, title: string} | null} chatItem
   * @param peerIdJSON
   * @param isBlocked
   * @param avatar
   * @param isNeedingUpdate
   */
  constructor({
    id,
    username,
    database,
    chatItem = null,
    peerIdJSON = null,
    isBlocked = false,
    avatar = null,
    isNeedingUpdate = false,
  }) {
    super();
    // TODO add validations
    this.id = id;
    this.username = username;
    this.database = database;
    this.isBlocked = isBlocked;
    this.isNeedingUpdate = isNeedingUpdate;

    this.avatar = avatar;

    this.peerId = PeerId.createFromB58String(id);
    this.peerIdJSON = peerIdJSON || null;
    this.peerInfo = null;

    this.isConnected = false;

    this.chatItem = chatItem || {
      title: this.username,
      subtitle: "",
      date: null,
      unread: 0,
    };
  }

  handleMessage(message) {
    this.emit(User.EVENTS.MESSAGE, message);
  }

  clearConversation = async () => {
    // TODO move to constructor

    await this.database.conversations.where({ partnerId: this.id }).delete();

    this.emit(User.EVENTS.CLEAR); // TODO: use enum
  };

  delete = async () => {
    // TODO move to constructor

    await this.database.transaction("rw", this.database.users, this.database.conversations, async () => {
      await this.database.conversations.where({ partnerId: this.id }).delete();

      await this.database.users.where({ id: this.id }).delete();
    });

    this.emit(User.EVENTS.DELETE);
  };

  block = async () => {
    await this.database.users.put({ ...this.export(), isBlocked: true });
    this.isBlocked = true;

    this.emit(User.EVENTS.BLOCK);
  }

  /**
   * TODO
   * @return {{chatItem: {date: null, unread: number, subtitle: string, title: string}, id: (String|{autoIncrement: boolean, type: *, primaryKey: boolean}), username: (String|{unique: boolean, allowNull: boolean, type: *, validate: {len: number[], notEmpty: boolean}})}}
   */
  export(withPeerId = false) {
    return {
      id: this.id,
      username: this.username,
      chatItem: this.chatItem,
      isBlocked: this.isBlocked,
      isNeedingUpdate: this.isNeedingUpdate,
      avatar: this.avatar,
      ...(withPeerId ? { peerIdJSON: this.peerIdJSON } : {}),
    };
  }
}

export default User;
