import { receiveData, sendData } from "../../Connection";
import PROTOCOLS, { CHAT_MESSAGE_STATUS, UPDATE_EVENTS } from "../constants";
import BaseProtocol from "../BaseProtocol";


export default class UpdateProtocol extends BaseProtocol {
  FILE_PARTS = {};

  MAX_CHAT_ITEM_SUBTITLE = 15;

  constructor(node, database, user) {
    super(node, database);

    this.user = user;
  }

  handler = async ({ connection, stream }) => {
    try {
      const data = await receiveData(stream.source);
      const user = await this.database.users.get({ id: connection.remotePeer.toB58String() });

      if (!user || user.isBlocked) {
        // TODO: do we close the connection afther the message?
        await sendData(stream.sink, [CHAT_MESSAGE_STATUS.REFUSED]);

        await receiveData(stream.source); // TODO: we don't care for the response?

        // TODO: is ok?
        await this.node.hangUp(connection.remotePeer);
      } else if (data.length) {
        // await sendData(stream.sink, [CHAT_MESSAGE_STATUS.OK]); TODO

        let avatar;

        const message = data.shift().toString();

        if (this.FILE_PARTS[user.username]) {
          if (message !== "FINAL") {
            this.FILE_PARTS[user.username].push(message);
          } else {
            avatar = this.FILE_PARTS[user.username].join("");

            delete this.FILE_PARTS[user.username];
          }
        } else {
          this.FILE_PARTS[user.username] = [message];
        }

        if (avatar) {
          await this.database.users.put({ ...user.export(), avatar });

          this.emit(UPDATE_EVENTS.UPDATED, user, avatar);
        }
      } else {
        // TODO throw MessageIsNullException or something
      }
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  };


  update = async (peerId, dataURI) => {
    // TODO: maybe combine sendFunctions
    if (!(peerId && dataURI)) {
      throw new Error(); // TODO
    }

    try {
      const numChunks = Math.ceil(dataURI.length / 200_000);

      for (let i = 0, o = 0; i < numChunks; i++, o += 200_000) {
        // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
        // eslint-disable-next-line no-await-in-loop
        const { stream } = await this.node.dialProtocol(peerId, PROTOCOLS.UPDATE); // todo: works withouth info?

        // eslint-disable-next-line no-await-in-loop
        await sendData(stream.sink, [dataURI.substr(o, 200_000)]);
      }

      // const info = await this.node.peerRouting.findPeer(peerId); // TODO: handle not found error
      const { stream } = await this.node.dialProtocol(peerId, PROTOCOLS.UPDATE); // todo: works withouth info?
      await sendData(stream.sink, ["FINAL"]);
    } catch (error) {
      // TODO, maybe try to resend, show disconnected, etc
      console.log(error);
      console.log(error.message);
    }
  };
}
