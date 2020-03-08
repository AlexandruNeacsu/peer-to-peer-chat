import SimplePeer from "simple-peer";
import EventEmitter from "events";


const peers = [];
const emitter = new EventEmitter();


export default function () {
  const socket = new WebSocket('ws://localhost:3210');

  socket.onclose = () => console.log('Socket closed');
  socket.onerror = err => { console.log('Socket error'); console.log(err); };
  socket.onopen = () => console.log('Connected');

  socket.onmessage = (event) => {
    const body = JSON.parse(event.data);
    const { action, data } = body;

    switch (action) {
      case "DISCOVER": {


        break;
      }

      case "DISCOVER-RESPONSE": {
        emitter.emit("DISCOVER-RESPONSE", data);

        break;
      }

      default:
        break;
    }


    const rtc = new SimplePeer({ initiator: false, trickle: false });

    rtc.signal(data);

    rtc.on('signal', (data) => {
      socket.send(JSON.stringify(data));
    });

    rtc.on('connect', () => {
      peers.push(rtc);
    });

    rtc.on('data', (data) => {
      const msg = JSON.parse(data);
      emitter.emit('message', msg);
    });
  };

  return {
    onReady: (callback) => {
      //the host is always "ready" although it may
      //not have any clients
      callback();
    },

    send: (peer, message) => {
      peer.send(JSON.stringify(message));
    },

    onMessage: (callback) => {
      emitter.on('message', callback);
    },

    findPeer: (peerName) => new Promise((resolve, reject) => {
      const peer = new SimplePeer({ initiator: true, trickle: false });

      peer.on('signal', (data) => {
        socket.send({
          action: "DISCOVER",
          body: {
            peer: peerName,
            data: JSON.stringify(data),
          }
        });
      });

      emitter.on("DISCOVER-RESPONSE", (data) => {
        peer.signal(JSON.parse(data));
      });


      return peer;
    }),
  };
};
