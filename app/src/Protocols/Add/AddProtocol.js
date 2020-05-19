import PeerId from "peer-id";
import axios from "axios";
import PROTOCOLS, { ADD_ENUM, ADD_EVENTS } from "../constants";
import { receiveData, sendData } from "../../Connection";
import AddRequest from "./AddRequest";
import BaseProtocol from "../BaseProtocol";


export default class AddProtocol extends BaseProtocol {
  _acceptRequest = async (request) => {
    await this.database.transaction("rw", this.database.requests, this.database.users, async () => {
      await this.database.requests.delete(request.id);

      await this.database.users.add({ id: request.id, username: request.username });
    });
  }

  handler = async ({ connection, stream }) => {
    // TODO: is this concurrent safe?
    // TODO: do we need to close the connection? how about on a refuse? or after final response?
    const id = connection.remotePeer.toB58String();

    try {
      const messages = await receiveData(stream.source);
      const message = messages.shift().toString();

      console.log(message)

      switch (message) {
        case ADD_ENUM.ADD: {
          const request = { id, username: messages.shift().toString() };

          await this.database.transaction("rw", this.database.requests, this.database.users, async () => {
            const alreadyRegistered = await this.database.requests.get({ id: request.id });

            if (alreadyRegistered && alreadyRegistered.sent) {
              // we sent a request and it wasn't accepted
              // just accept the request
              await this._acceptRequest(request.id, request.username);

              await sendData(stream.sink, [ADD_ENUM.ACCEPTED]);
              this.emit(ADD_EVENTS.ACCEPTED, request);
            } else if (!alreadyRegistered) {
              await this.database.requests.add({ ...request, sent: false });

              await sendData(stream.sink, [ADD_ENUM.RECEIVED]);
              this.emit(ADD_EVENTS.RECEIVED, request);
            }
          });

          break;
        }
        case ADD_ENUM.ACCEPTED: {
          // response to a contact request we sent at another moment in time
          await this.database.transaction("rw", this.database.requests, this.database.users, async () => {
            const request = await this.database.requests.get({ id });

            if (request && request.sent) {
              // we sent a request and it wasn't accepted
              // just accept the request
              await this._acceptRequest(request);

              this.emit(ADD_EVENTS.ACCEPTED, request);

              await sendData(stream.sink, [ADD_ENUM.OK]);
            } else {
              // TODO: sent not registered message
            }
          });
          break;
        }
        case ADD_ENUM.REJECTED: {
          const request = await this.database.requests.get({ id });

          if (request) {
            await this.database.requests.delete(id);

            this.emit(ADD_EVENTS.REJECTED, request);

            // TODO: maybe send confirmation?
            // TODO: add notification: has been rejected
          }
          break;
        }
        default:
          console.log(`Received unknown message ${message}`);
      }
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  };

  add = async (ownUsername, contactUsername) => {
    // TODO redial for peers we have the id but didn't found!
    try {
      // get the associated peerId
      const response = await axios.get(`http://192.168.0.2:8080/username/${contactUsername}`); // TODO: handle not found, etc
      const { peerId: B58StringId } = response.data;

      const peerId = PeerId.createFromB58String(B58StringId);
      const peerInfo = await this.node.peerRouting.findPeer(peerId); // TODO: handle not found error
      const { stream } = await this.node.dialProtocol(peerInfo, "/add/1.0.0");

      /*
      TODO: what to do if peer is not found
      how do we handle accepting the contact request locally
      and then send our response to the remote user when connection is available
      */
      let request = await this.database.requests.get({ id: B58StringId });

      if (request && !request.sent) {
        // we received a request and we haven't accepted it

        await sendData(stream.sink, [ADD_ENUM.ACCEPTED]);

        const messages = await receiveData(stream.source);
        const message = messages.shift().toString();

        if (message === ADD_ENUM.OK) {
          await this._acceptRequest(request);

          this.emit(ADD_EVENTS.ACCEPTED, request);
        } else {
          // TODO crash, burn
        }

        // TODO: snackbar that it was accepted?
      } else if (!request) {
        // no request sent or received
        request = new AddRequest(B58StringId, contactUsername);

        await sendData(stream.sink, [ADD_ENUM.ADD, ownUsername]);

        console.log("aaa")

        const messages = await receiveData(stream.source); //TODO
        const message = messages.shift().toString();

        console.log(message)

        if (message === ADD_ENUM.RECEIVED) {
          await this.database.requests.add({ ...request, sent: true }); // TODO: wouldn't contact id clash with request id?
          this.emit(ADD_EVENTS.SENT, request);
        } else if (message === ADD_ENUM.ACCEPTED) {
          await this.database.users.add({ id: request.id, username: request.username });
          this.emit(ADD_EVENTS.ACCEPTED, request);
        }
      }
    } catch (error) {
      if (error.response) {
        // TODO: handle username not found, server error from nameservice, etc
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // TODO id not found, contact not reached, etc...
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        console.log(error);
      }
    }
  };

  accept = async (id, username) => {
    const request = new AddRequest(id, username);
    // TODO: resend accept when peer is online
    const peerId = PeerId.createFromB58String(request.id);

    const info = await this.node.peerRouting.findPeer(peerId); // TODO: handle not found error
    const { stream } = await this.node.dialProtocol(info, PROTOCOLS.ADD);
    await sendData(stream.sink, [ADD_ENUM.ACCEPTED]); // TODO what if they didn't receive the message?

    let message = await receiveData(stream.source);
    message = message.shift().toString();

    if (message === ADD_ENUM.OK) {
      await this._acceptRequest(request);

      this.emit(ADD_EVENTS.ACCEPTED, request);
    }
  };

  reject = async (id, username) => {
    const request = new AddRequest(id, username);

    await this.database.requests.delete(request.id);

    // TODO: resend accept when peer is online
    const peerId = PeerId.createFromB58String(request.id);
    const info = await this.node.peerRouting.findPeer(peerId); // TODO: handle not found error
    const { stream } = await this.node.dialProtocol(info, PROTOCOLS.ADD);

    await sendData(stream.sink, [ADD_ENUM.REJECTED]); // TODO what if they didn't receive the message?

    // TODO: maybe await for confirmation?

    this.emit(ADD_EVENTS.REJECTED, request);
  };
}
