import Libp2p from "libp2p";
import WebRTCStar from "libp2p-webrtc-star";
import SECIO from "libp2p-secio";
import Mplex from "libp2p-mplex";
import DHT from "libp2p-kad-dht";
import PeerInfo from "peer-info";
import pipe from "it-pipe";
import lp from "it-length-prefixed";

class PeerNode extends Libp2p {
  name = "PeerNode";

  protocols = new Map();

  constructor(peerInfo) {
    const modules = {
      peerInfo,
      transport: [WebRTCStar], // TODO: do we need WS?
      connEncryption: [SECIO],
      streamMuxer: [Mplex],
      dht: DHT,
    };

    const config = {
      peerDiscovery: {
        webRTCStar: {
          enabled: true,
        },
      },
      dht: {
        kBucketSize: 20, // TODO
        enabled: true,
        randomWalk: {
          enabled: true,
          interval: 300e3,
          timeout: 10e3,
        },
      },
      relay: {
        enabled: true,
        hop: {
          enabled: true,
          active: true
        }
      }
    };

    super({
      modules,
      config,
      peerInfo,
    });

    this.peerInfo = peerInfo;
  }

  handleProtocol(protocol, HandlerClass, options) {
    const implementation = new HandlerClass(this, options);

    this.handle(protocol, implementation.handler);
    this.protocols.set(protocol, implementation);
  }

  getImplementation(protocol) {
    return this.protocols.get(protocol);
  }
}


/**
 * Creates a node given a peerId
 * @param {PeerId} id
 * @returns {Promise<PeerNode>}
 */
export default async function createNode(id) {
  const peerInfo = await PeerInfo.create(id);

  const peerIdStr = peerInfo.id.toB58String();

  const signalingServers = JSON.parse(localStorage.getItem("signal-selected-servers"));

  signalingServers.forEach(
    ({ value, port, type }) => peerInfo.multiaddrs.add(`/${type}/${value}/tcp/${port}/wss/p2p-webrtc-star/p2p/${peerIdStr}`)
  );

  return new PeerNode(peerInfo);
}

/**
 * Send data to a sink
 * @param sink
 * @param {String[] | ArrayBuffer} data
 */
export async function sendData(sink, data) {
  // TODO: handle single object
  // TODO: handle array of objects(stringify)
  return pipe(
    data,
    lp.encode(),
    sink,
  );
}

/**
 *
 * @param source
 * @param {AsyncIterator} source
 * @returns {Promise<String[]>}
 */
export async function receiveData(source) {
  return pipe(
    source,
    lp.decode(),
    async (data) => {
      const messages = [];

      for await (const chunk of data) {
        messages.push(chunk);
      }

      return messages;
    },
  );
}
