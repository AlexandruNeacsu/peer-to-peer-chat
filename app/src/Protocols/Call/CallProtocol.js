import SimplePeer from "simple-peer";
import BaseProtocol from "../BaseProtocol";
import { receiveData, sendData } from "../../Connection";
import PROTOCOLS, { CALL_EVENTS } from "../constants";


export default class ChatProtocol extends BaseProtocol {
  handler = async ({ connection, stream }) => {
    // const database = DatabaseHandler.getDatabase();
    // const user = await database.users.get({ id: connection.remotePeer.toB58String() });

    // if (!user) {
    //   // TODO: do we close the connection afther the message?
    //   await sendData(stream.sink, ["REFUSED"]);
    //
    //   // TODO: is ok?
    //   await node.hangUp(connection.remotePeer);
    // } else {
    try {
      let signalData = await receiveData(stream.source);
      signalData = JSON.parse(signalData.shift().toString());

      const peer = new SimplePeer({ initiator: false, trickle: false });
      peer.signal(signalData);

      peer.on("signal", async data => {
        await sendData(stream.sink, [JSON.stringify(data)]);
      });

      peer.on("stream", videoStream => this.emit(CALL_EVENTS.CALLED, videoStream));
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
    // }
  };

  call = async (user, video = false) => {
    // TODO: maybe combine sendFunctions
    if (!user) {
      throw new Error(); // TODO
    }
    try {
      // const peerId = PeerId.createFromB58String(user);

      // const initialMessage = {
      //   type: "CALL",
      //   username: user.username,
      // };

      const { stream } = await this.node.dialProtocol(user.peerId, PROTOCOLS.CALL); // todo: works withouth info?
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: true,
      });

      const peer = new SimplePeer({ initiator: true, stream: videoStream, trickle: false });

      peer.on("signal", async data => {
        await sendData(stream.sink, [JSON.stringify(data)]);

        let signalData = await receiveData(stream.source);

        if (signalData.length) {
          signalData = JSON.parse(signalData.shift().toString());
          console.log(signalData)

          peer.signal(signalData);
        }
      });

      this.emit(CALL_EVENTS.CALL, user, videoStream);

      return videoStream;
    } catch (error) {
      // TODO, maybe try to resend, show disconnected, etc
      console.log(error);
      console.log(error.message);

      return null;
    }
  };
}
