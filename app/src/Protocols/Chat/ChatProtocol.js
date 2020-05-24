import PeerId from "peer-id";
import pushable from "it-pushable";
import DatabaseHandler from "../../Database";
import { receiveData, sendData } from "../../Connection";
import PROTOCOLS, { CHAT_EVENTS, CHAT_MESSAGE_STATUS, CHAT_MESSAGE_TYPE } from "../constants";
import BaseProtocol from "../BaseProtocol";


export default class ChatProtocol extends BaseProtocol {
  FILE_PARTS = {};

  MAX_CHAT_ITEM_SUBTITLE = 15;

  constructor(node, database, user) {
    super(node, database);

    this.user = user;
  }

  handler = async ({ connection, stream }) => {
    const user = await this.database.users.get({ id: connection.remotePeer.toB58String() });

    if (!user) {
      // TODO: do we close the connection afther the message?
      await sendData(stream.sink, [CHAT_MESSAGE_STATUS.REFUSED]);

      // TODO: is ok?
      await this.node.hangUp(connection.remotePeer);
    } else {
      try {
        const data = await receiveData(stream.source);

        if (data.length) {
          let structuredMessage;

          const initialMessage = JSON.parse(data.shift().toString());

          const chatItem = {
            title: user.username,
            date: new Date(),
            unread: 0,
          };

          switch (initialMessage.type) {
            case CHAT_MESSAGE_TYPE.TEXT: {
              // TODO: use message class
              // TODO: parse the message to ensure structure
              structuredMessage = {
                type: initialMessage.type,
                sentDate: initialMessage.sentDate,
                text: initialMessage.text,
                replyMessage: initialMessage.replyMessage,
                receivedDate: chatItem.date,
                partnerId: user.id,
                partnerUsername: user.username, // TODO: this will show old username in chat history
                senderId: user.id,
                status: CHAT_MESSAGE_STATUS.RECEIVED,
              };

              chatItem.subtitle = structuredMessage.text.slice(0, this.MAX_CHAT_ITEM_SUBTITLE);

              break;
            }
            case CHAT_MESSAGE_TYPE.FILE: {
              if (this.FILE_PARTS[initialMessage.file.name]) {
                if (!initialMessage.final) {
                  this.FILE_PARTS[initialMessage.file.name]
                    .data
                    .push(data.shift().slice());
                } else {
                  const parts = this.FILE_PARTS[initialMessage.file.name].data;
                  // Get the total length of all arrays.
                  let length = 0;
                  parts.forEach(item => {
                    length += item.length;
                  });

                  const mergedArray = new Uint8Array(length);
                  let offset = 0;
                  parts.forEach(item => {
                    mergedArray.set(item, offset);
                    offset += item.length;
                  });

                  delete this.FILE_PARTS[initialMessage.file.name];

                  structuredMessage = {
                    type: initialMessage.file.type,
                    file: {
                      name: initialMessage.file.name,
                      type: initialMessage.file.type,
                      data: mergedArray,
                    },
                    sentDate: initialMessage.sentDate,
                    receivedDate: new Date(),
                    partnerId: user.id,
                    partnerUsername: user.username, // TODO: this will show old username in chat history
                    senderId: user.id,
                    status: CHAT_MESSAGE_STATUS.RECEIVED, // TODO move to an enum
                  };

                  chatItem.subtitle = "POZA TODO"; // TODO
                }
              } else {
                this.FILE_PARTS[initialMessage.file.name] = {
                  name: initialMessage.file.name,
                  type: initialMessage.file.type,
                  data: [data.shift().slice()],
                };
              }

              break;
            }
            default:
              // TODO throw
              break;
          }

          if (structuredMessage) {
            await this.database.transaction("rw", this.database.users, this.database.conversations, async () => {
              await this.database.conversations.add(structuredMessage);

              chatItem.unread = await this.database.conversations.where({
                status: CHAT_MESSAGE_STATUS.RECEIVED,
                partnerId: user.id,
              }).count();

              await this.database.users.put({ ...user, chatItem });
            });


            this.emit(CHAT_EVENTS.RECEIVED, user, chatItem, structuredMessage);
          }
        } else {
          // TODO throw MessageIsNullException or something
        }
      } catch (error) {
        // TODO
        console.log(error);
        console.log(error.message);
      }
    }
  };

  sendText = async (user, text, replyMessage) => {
    if (!(user && text)) {
      throw new Error(); // TODO
    }

    try {
      const message = {
        type: CHAT_MESSAGE_TYPE.TEXT,
        sentDate: new Date(), // TODO: repalce with new Date() ?
        text,
        replyMessage,
      };

      const peerId = PeerId.createFromB58String(user.id);
      // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
      const { stream } = await this.node.dialProtocol(peerId, PROTOCOLS.CHAT); // todo: works withouth info?

      await sendData(stream.sink, [JSON.stringify(message)]);

      const structuredMessage = {
        ...message,
        partnerId: user.id,
        partnerUsername: user.username, // TODO: will show old username in chat history
        senderId: localStorage.getItem("id"),
        status: CHAT_MESSAGE_STATUS.SENT,
        replyMessage,
      };

      const chatItem = {
        title: user.username,
        subtitle: text.slice(0, this.MAX_CHAT_ITEM_SUBTITLE),
        date: message.sentDate,
        unread: 0, // sanity check
      };

      await this.database.transaction("rw", this.database.users, this.database.conversations, async () => {
        await this.database.conversations.add(structuredMessage);
        await this.database.users.put({ ...user.export(), chatItem });
      });

      this.emit(CHAT_EVENTS.SENT, user, chatItem, structuredMessage);

      return structuredMessage;
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);

      return null;
    }
  };

  sendFile = async (user, file) => {
    // TODO: maybe combine sendFunctions
    if (!(user && file)) {
      throw new Error(); // TODO
    }

    try {
      const peerId = PeerId.createFromB58String(user.id);

      // TODO check files format {file: FILE, text: String}
      const initialMessage = {
        type: CHAT_MESSAGE_TYPE.FILE,
        file: {
          name: file.name,
          type: file.type === "image" ? "PHOTO" : "FILE", // TODO
        },
      };

      for (let i = 0; i < file.data.length; i += 200_000) {
        // const info = await ownNode.peerRouting.findPeer(peerId); // TODO: handle not found error
        // eslint-disable-next-line no-await-in-loop
        const { stream } = await this.node.dialProtocol(peerId, PROTOCOLS.CHAT); // todo: works withouth info?

        const source = pushable();
        source.push(JSON.stringify(initialMessage));
        source.push(file.data.slice(i, i + 200_000));
        source.end();

        // eslint-disable-next-line no-await-in-loop
        await sendData(stream.sink, source);
      }

      // const info = await this.node.peerRouting.findPeer(peerId); // TODO: handle not found error
      const { stream } = await this.node.dialProtocol(peerId, PROTOCOLS.CHAT); // todo: works withouth info?

      // TODO check files format {file: FILE, text: String}
      const finalMessage = {
        type: CHAT_MESSAGE_TYPE.FILE,
        final: true,
        sentDate: new Date(),
        file: {
          name: file.name,
          type: file.type === "image" ? "PHOTO" : "FILE", // TODo
        },
      };

      await sendData(stream.sink, [JSON.stringify(finalMessage)]);


      const structuredMessage = {
        type: file.type === "image" ? "PHOTO" : "FILE",
        sentDate: finalMessage.sentDate,
        partnerId: user.id,
        partnerUsername: user.username, // TODO: will show old username in chat history
        senderId: localStorage.getItem("id"),
        status: "sent", // TODO move to an enum && handle wainting status(before sending with sendData)
        file,
      };

      const chatItem = {
        title: user.username,
        subtitle: "FISIER TODO", // TODO
        date: finalMessage.sentDate,
        unread: 0, // sanity check
      };

      const database = DatabaseHandler.getDatabase();
      await database.transaction("rw", database.users, database.conversations, async () => {
        await database.conversations.add(structuredMessage);
        await database.users.put({ ...user.export(), chatItem });
      });

      this.emit(CHAT_EVENTS.SENT, user, chatItem, structuredMessage);

      return structuredMessage;
    } catch (error) {
      // TODO, maybe try to resend, show disconnected, etc
      console.log(error);
      console.log(error.message);

      return null;
    }
  };
}
