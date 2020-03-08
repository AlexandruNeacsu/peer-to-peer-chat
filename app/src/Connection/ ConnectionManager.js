import EventEmitter from "events";
import ClientConnection from "./ClientConnection";
import HostConnection from "./HostConnection";

let connection = null;
const emitter = new EventEmitter();

function setupConnection(conn) {
	conn.onReady(function() {
		connection = conn;

		console.log(conn)
		emitter.emit('status');
	});

	conn.onMessage(function(msg) {
		emitter.emit('message', msg);
	});
}

export default {
	isConnected: function() {
		return connection !== null;
	},

	sendMessage: function(message) {
		connection.send(message);
	},

	onMessage: function(cb) {
		emitter.on('message', cb);
	},

	onStatusChange: function(cb) {
		emitter.on('status', cb);
	},

	offMessage: function(cb) {
		emitter.off('message', cb);
	},

	offStatusChange: function(cb) {
		emitter.off('status', cb);
	},

	host: function() {
		setupConnection(HostConnection());
	},

	join: function() {
		setupConnection(ClientConnection());
	}
};
