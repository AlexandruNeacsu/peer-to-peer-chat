import SimplePeer from "simple-peer";
import EventEmitter from "events";
import ServerConnectionError from "./Errors/ServerConnectionError";

const peers = [];
const emitter = new EventEmitter();


export default () => new Promise((resolve, reject) => {
  const socket = new WebSocket("ws://localhost:8080/signal");

  socket.onclose = (event) => emitter.emit("close", event);
  socket.onerror = (error) => {
    if (socket.readyState === socket.CONNECTING) {
      reject(new ServerConnectionError("Couldn't connect to server.", error));
      // TODO handle other errors by checking readyState
    } else {
      reject(error);
    }
  };

  socket.onmessage = (message) => {
    const parsedMessaged = JSON.parse(message.data);
    console.log("received");
    console.log(parsedMessaged);

    const { action, body } = parsedMessaged;
    const { data } = body;


    switch (action) {
      case "DISCOVER": {
        // TODO: ask user if he wants to accept
        const rtc = new SimplePeer({ initiator: false, trickle: false });
        rtc.signal(data);

        const { sender } = body;
        rtc.on("signal", (data) => socket.send(JSON.stringify({
          action: "DISCOVER-RESPONSE",
          body: {
            data,
            recipient: sender,
          },
        })));

        rtc.on("connect", () => {
          peers.push(rtc);
        });

        // rtc.on('data', (data) => {
        //   const msg = JSON.parse(data);
        //   emitter.emit('message', msg);
        // });

        break;
      }

      case "DISCOVER-RESPONSE": {
        if (parsedMessaged.status !== "error") {
          console.log("resp");
          console.log(emitter.emit("DISCOVER-RESPONSE", data));
        } else {
          console.error(data);
        }


        break;
      }

      default:
        break;
    }
  };

  // return an interface
  socket.onopen = () => resolve({
    // send: (peer, message) => {
    //   peer.send(JSON.stringify(message));
    // },

    // onMessage: (callback) => {
    //   emitter.on("message", callback);
    // },

    findPeer: (peerName) => new Promise((resolve, reject) => {
      const peer = new SimplePeer({ initiator: true, trickle: false });

      peer.on("signal", (data) => {
        socket.send(JSON.stringify({
          action: "DISCOVER",
          body: {
            recipient: peerName,
            data,
          },
        }));
      });

      const callback = (signalData) => {
        console.log(signalData);
        console.log("peer signal");

        peer.signal(signalData);

        resolve(peer);

        emitter.removeListener("DISCOVER-RESPONSE", callback);
      };

      console.log("setting listener");
      console.log(emitter.on("DISCOVER-RESPONSE", callback));
    }),

    close: () => new Promise((resolveClose, rejectClose) => {
      try {
        socket.close();

        emitter.on("close", (closeEvent) => resolveClose(closeEvent));
      } catch (e) {
        rejectClose(e);
      }
    }),
  });
});
