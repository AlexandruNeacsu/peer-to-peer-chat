import SimplePeer from "simple-peer";
import EventEmitter from "events";

const emitter = new EventEmitter();

export default function () {
	const socket = new WebSocket('ws://192.168.0.2:3210');
	let rtc;
	socket.onclose = () => console.log('Socket closed');
	socket.onerror = err => { console.log('Socket error'); console.log(err); };

	socket.onopen = () => {
		rtc = new SimplePeer({ initiator: true, trickle: false });
		rtc.on('signal', (data) => {
			socket.send(JSON.stringify(data));
		});

		socket.onmessage = (event) => {
			rtc.signal(JSON.parse(event.data));
		};

		rtc.on('connect', () => {
			emitter.emit('connected');
			//we no longer need the signaler
			socket.close();
		});

		rtc.on('data', (message) => {
			emitter.emit('message', JSON.parse(message));
		});
	};

	return {
		onReady: (callback) => {
			emitter.on('connected', callback);
		},

		send: (message) => {
			rtc.send(JSON.stringify(message));
		},

		onMessage: (cb) => {
			emitter.on('message', cb);
		}
	};
};
