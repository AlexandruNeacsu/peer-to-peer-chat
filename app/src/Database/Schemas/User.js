import PeerId from "peer-id";
import EventEmitter from "events";

class User extends EventEmitter {
  /**
   * @param {String} id
   * @param {String }username
   * @param {{date: null, unread: number, subtitle: string, title: string} | null} chatItem
   * @param peerIdJSON
   */
  constructor(id, username, chatItem = null, peerIdJSON = null) {
    super();

    // TODO add validations
    this.id = id;
    this.username = username;
    this.avatar = null;

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
    this.emit("message", message);
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
      ...(withPeerId ? { peerIdJSON: this.peerIdJSON } : {}),
    };
  }
}

export default User;
