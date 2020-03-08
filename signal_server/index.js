'use strict';

const express = require('express');
const session = require('express-session');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const map = new Map();

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
  saveUninitialized: false,
  secret: 'Secret-Discreet#45$',
  resave: false
});


app.use(sessionParser);

app.post('/login', function (req, res) {
  //
  // "Log in" user and set userId to session.
  //
  const id = req.body.username;

  if (map.has(id)) res.status(401).json({ message: "Login failed, bad credentials!" });

  console.log(`Updating session for user ${id}`);
  req.session.userId = id;

  res.send({ result: 'OK', message: 'Session updated' });
});

app.delete('/logout', function (request, response) {
  const ws = map.get(request.session.userId);

  console.log('Destroying session');

  request.session.destroy(() => {
    if (ws) ws.close();

    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});

//
// Create HTTP server by ourselves.
//
const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');

    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  });
});

wss.on('connection', (ws, request) => {
  const userId = request.session.userId;

  map.set(userId, ws);

  ws.on('message', (message) => {
    console.log(`Received message ${message} from user ${userId}`);

    switch (message.action) {
      case "DISCOVER":
        const { peer } = message.body;

        if (!map.has(peer)) {
          ws.send({ status: "error", message: "Coudn't find peer!" });
        } else {
          const peerSocket = map.get(peer);
          const { data } = message.body;

          peerSocket.send(data);
        }

        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    map.delete(userId);
  });
});

//
// Start the server.
//
server.listen(8080, function () {
  console.log('Listening on http://localhost:8080');
});