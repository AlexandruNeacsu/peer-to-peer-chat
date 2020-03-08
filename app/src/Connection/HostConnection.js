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
		const data = JSON.parse(event.data);
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

			//as host, we need to broadcast the data to the other peers
			peers.forEach((p) => {
				if (p === rtc) {
					return;
				}

				p.send(msg);
			});
		});
	};

	return {
		onReady: (callback) => {
			//the host is always "ready" although it may
			//not have any clients
			callback();
		},

		send: (message) => {
			peers.forEach(p => p.send(JSON.stringify(message)));
		},

		onMessage: (callback) => {
			emitter.on('message', callback);
		}
	};
};
