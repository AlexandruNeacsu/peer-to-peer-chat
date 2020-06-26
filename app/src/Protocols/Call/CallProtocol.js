import SimplePeer from "simple-peer";
import BaseProtocol from "../BaseProtocol";
import { receiveData, sendData } from "../../Connection";
import PROTOCOLS, { CALL_EVENTS, CALL_MESSAGES } from "../constants";


export default class ChatProtocol extends BaseProtocol {
  constructor(node, database) {
    super(node, database);

    /** type MediaStream */
    this._stream = null;

    /** type SimplePeer */
    this._peer = null;

    this._peerId = null;
  }

  handler = async ({ connection, stream }) => {
    try {
      if (this._peerId && this._peerId.toB58String() === connection.remotePeer.toB58String()) {
        // we already have a connection. Refuse all other

        await this._handleExistingCall(stream);

        return;
      }

      if (this._peerId) {
        await sendData(stream.sink, [CALL_MESSAGES.REFUSED]);

        await this.node.hangUp(connection.remotePeer);

        return;
      }

      const user = await this._checkIsContact(stream, connection);
      if (!user) {
        return;
      }

      this._peerId = connection.remotePeer;

      await this._handleNewCall(stream, user);
    } catch (error) {
      // TODO
      console.log(error);
      console.log(error.message);
    }
  };

  _checkIsContact = async (stream, connection) => {
    const user = await this.database.users.get({ id: connection.remotePeer.toB58String() });

    if (!user || user.isBlocked) {
      // TODO: do we close the connection afther the message?
      await sendData(stream.sink, [CALL_MESSAGES.REFUSED]);

      await receiveData(stream.source); // TODO: do we check response?

      // TODO: is ok?
      await this.node.hangUp(connection.remotePeer);

      return null;
    }

    return user;
  }

  _handleExistingCall = async (stream) => {
    const message = await receiveData(stream.source);

    const type = message.shift().toString();

    switch (type) {
      case CALL_MESSAGES.SIGNAL: {
        // we sent an offer and we now accept it

        let data = message.shift().toString();
        data = JSON.parse(data);
        console.log(data);

        this._peer.signal(data);

        break;
      }

      case CALL_MESSAGES.ACCEPTED: {
        this.emit(CALL_EVENTS.ACCEPTED);
        break;
      }

      case CALL_MESSAGES.REFUSED: {
        // this.emit(CALL_EVENTS.REFUSED);

        this.hangUp();
        break;
      }

      default:
        console.log("Received unknows message!");
    }
  }

  _handleNewCall = async (stream, user) => {
    await sendData(stream.sink, [CALL_MESSAGES.OK]);

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMicrophone = devices.some(device => device.kind === "audioinput");
    console.log(hasMicrophone)

    if (hasMicrophone) {
      this._stream = await this._buildStream(false, true);
    }

    const data = await receiveData(stream.source);

    let signalData = data.shift().toString();
    console.log(signalData);
    signalData = JSON.parse(signalData);


    this._peer = new SimplePeer({ initiator: false, stream: this._stream, trickle: true });
    this._peer.on("signal", async responseSignal => {
      const response = JSON.stringify(responseSignal);

      const { stream: responseStream } = await this.node.dialProtocol(this._peerId, PROTOCOLS.CALL);
      await sendData(responseStream.sink, [CALL_MESSAGES.SIGNAL, response]);
    });

    this._peer.signal(signalData);

    this._peer.on("connect", () => this.emit(CALL_EVENTS.CALLED, user));

    this._peer.on(
      "stream",
      peerStream => console.log("receive stream") || this.emit(CALL_EVENTS.CALLED, user, peerStream),
    );

    this._peer.on("track", (track, peerStream) => console.log("receive track") || this.emit(CALL_EVENTS.TRACK, track, peerStream));

    this._peer.on("close", this.hangUp);
  }

  call = async (user, video = false) => {
    // TODO: maybe combine sendFunctions
    if (!user) {
      throw new Error(); // TODO
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === "audioinput");

      console.log(hasMicrophone)
      if (hasMicrophone) {
        this._stream = await this._buildStream(video, true);
      }

      const { stream } = await this.node.dialProtocol(user.peerId, PROTOCOLS.CALL);

      const response = await receiveData(stream.source);
      const isOk = response.shift().toString();

      if (isOk !== CALL_MESSAGES.OK) {
        await sendData(stream.sink, [CALL_MESSAGES.ACKNOWLEDGED]);

        await user.block();
        this.emit(CALL_EVENTS.BLOCKED, user);

        return;
      }

      this._peer = new SimplePeer({ initiator: true, stream: this._stream, trickle: true });

      let initialSent = false;
      this._peer.on("signal", async data => {
        const stringified = JSON.stringify(data);

        if (!initialSent) {
          await sendData(stream.sink, [stringified]);
          initialSent = true;

          this._peerId = user.peerId;
        } else {
          // offer sent, sent all new signal events on new stream
          const { stream: newStream } = await this.node.dialProtocol(user.peerId, PROTOCOLS.CALL);
          await sendData(newStream.sink, [CALL_MESSAGES.SIGNAL, stringified]);
        }
      });


      this._peer.on(
        "stream",
        peerStream => this.emit(CALL_EVENTS.CALL, user, this._stream, peerStream),
      );

      this._peer.on("track", (track, peerStream) => this.emit(CALL_EVENTS.TRACK, track, peerStream));


      this._peer.on("close", this.hangUp);

      this._peer.on("error", (error) => {
        console.log(error);
        console.log(error.message);

        this.hangUp();
      });
    } catch (error) {
      // TODO, maybe try to resend, show disconnected, etc
      console.log(error);
      console.log(error.message);
    }
  };

  accept = async (willAnswer) => {
    const { stream: newStream } = await this.node.dialProtocol(this._peerId, PROTOCOLS.CALL);
    await sendData(newStream.sink, [willAnswer ? CALL_MESSAGES.ACCEPTED : CALL_MESSAGES.REFUSED]);
  }

  hangUp = () => {
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
    }

    if (this._peer) {
      this._peerId = null;
      this._peer.destroy();
    }

    this.emit(CALL_EVENTS.CLOSE);
  }

  changeMicrophone = () => {
    let isEnabled = false;

    if (this._peer && this._stream) {
      this._stream.getAudioTracks().forEach(track => {
        isEnabled = !track.enabled;

        // eslint-disable-next-line no-param-reassign
        track.enabled = !track.enabled;
      });
    }

    return isEnabled;
  };

  changeVideo = async () => {
    if (this._peer && this._stream) {
      // TODO: might not enable video if user doesn't have mic
      if (this._stream.getVideoTracks().length) {
        let isEnabled = false;

        this._stream.getVideoTracks().forEach(track => {
          isEnabled = !track.enabled;

          // eslint-disable-next-line no-param-reassign
          track.enabled = !track.enabled;
        });

        return isEnabled;
      }

      const videoStream = await this._buildStream(true, false);
      videoStream.getVideoTracks().forEach(track => {
        this._peer.addTrack(track, this._stream);
        this._stream.addTrack(track);

        videoStream.removeTrack(track);
      });

      return true;
    }

    return false;
  }

  /**
   *
   * @param video
   * @param audio
   * @returns {Promise<MediaStream>}
   */
  _buildStream = async (video, audio) => navigator.mediaDevices.getUserMedia({
    video,
    audio,
  })
}
