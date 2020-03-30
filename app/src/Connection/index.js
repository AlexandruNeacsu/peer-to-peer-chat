import SimplePeer from "simple-peer";
import EventEmitter from "events";
import ServerConnectionError from "./Errors/ServerConnectionError";

const peers = [];
const emitter = new EventEmitter();

let signalSocket = null;
let signalSocketInterface = null;

let signalSocketLastStatus = WebSocket.CONNECTING;

// TODO refactor to class

function getSignalSocketInterface() {
  // prevent re-renders by using the same object
  if (signalSocketInterface) return signalSocketInterface;

  signalSocketInterface = {

    // send: (peer, message) => {
    //   peer.send(JSON.stringify(message));
    // },

    // onMessage: (callback) => {
    //   emitter.on("message", callback);
    // },

    findPeer: (peerName) => new Promise((resolve, reject) => {
      const peer = new SimplePeer({ initiator: true, trickle: false });

      peer.on("signal", (data) => {
        signalSocket.send(JSON.stringify({
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
        signalSocketLastStatus = WebSocket.CLOSING;
        signalSocket.close();

        signalSocket = null;
        signalSocketLastStatus = WebSocket.CLOSED;


        emitter.on("close", (closeEvent) => resolveClose(closeEvent));
      } catch (e) {
        rejectClose(e);
      }
    }),
  };

  return signalSocketInterface;
}


const Connection = () => new Promise((resolve, reject) => {
  if (signalSocket !== null) {
    resolve(getSignalSocketInterface());
  } else {
    signalSocket = new WebSocket("ws://localhost:8080/signal");

    signalSocket.onclose = (event) => emitter.emit("close", event);
    signalSocket.onerror = (error) => {
      if (signalSocketLastStatus === WebSocket.CONNECTING) {
        console.log("Conn err")
        signalSocket = null;
        reject(new ServerConnectionError("Couldn't connect to server.", error));
        // TODO handle other errors by checking readyState
      } else {
        reject(error);
      }
    };

    signalSocket.onmessage = (message) => {
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
          rtc.on("signal", (data) => signalSocket.send(JSON.stringify({
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
    signalSocket.onopen = () => {
      signalSocketLastStatus = WebSocket.OPEN;
      resolve(getSignalSocketInterface());
    };
  }
});

export default Connection;
