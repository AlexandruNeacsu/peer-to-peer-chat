import Libp2p from "libp2p";
import WebRTCStar from "libp2p-webrtc-star";
import WS from "libp2p-websockets";
import SECIO from "libp2p-secio";
import MPLEX from "libp2p-mplex";
import DHT from "libp2p-kad-dht";
import PeerInfo from "peer-info";
import pipe from "it-pipe";
import lp from "it-length-prefixed";

class PeerNode extends Libp2p {
  constructor(peerInfo) {
    const modules = {
      peerInfo,
      transport: [WS, WebRTCStar], // TODO: do we need WS?
      connEncryption: [SECIO],
      streamMuxer: [MPLEX],
      dht: DHT,
      config: {
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
      },
    };

    super({
      modules,
      peerInfo,
    });

    this.peerInfo = peerInfo;
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

  peerInfo.multiaddrs.add(`/ip4/192.168.1.2/tcp/9090/ws/p2p-webrtc-star/p2p/${peerIdStr}`);
  peerInfo.multiaddrs.add("/ip4/0.0.0.0/tcp/0");

  return new PeerNode(peerInfo);
}

/**
 * Send data to a sink
 * @param sink
 * @param {String[]} data
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
 * @returns {Promise<String[]>}
 */
export async function receiveData(source) {
  return pipe(
    source,
    lp.decode(),
    async (data) => {
      const messages = [];

      for await (const chunk of data) {
        messages.push(chunk.toString());
      }

      return messages;
    },
  );
}
