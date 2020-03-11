'use strict';

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');


var expressWs = require('express-ws');

const app = express();
expressWs(app);

const map = new Map();


const SECRET = 'Secret-Discreet#45$';

const sessionParser = session({
  saveUninitialized: false,
  secret: SECRET, // TODO
  resave: false
});

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(sessionParser);
app.use(express.json());

app.post('/login', function (req, res) {
  const userId = req.body.username;

  if (req.session.userId) {
    console.log(`userId ${userId} already set`);
    res.send({ result: 'OK', message: 'Session updated' });
  }
  else if (map.has(userId)) {
    res.status(401).json({ message: "Login failed, bad credentials!" });
  }
  else {
    console.log(`Updating session for user ${userId}`);

    req.session.userId = userId;
    req.session.save();

    console.log(req.session)

    res.send({ result: 'OK', message: 'Session updated' });
  }
});

app.delete('/logout', function (request, response) {
  console.log('Destroying session');
  const { webSocket } = request.session;

  request.session.destroy(() => {
    console.log('destroyed')
    if (webSocket) webSocket.close();

    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});


const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      console.log("session not found!");
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', function (ws, request) {
  console.log(request.session)
  const userId = request.session.userId;

  map.set(userId, ws);

  ws.on('message', (msg) => {
    const parsedMessage = JSON.parse(msg);
    console.log(`Received message from user ${userId}`);

    switch (parsedMessage.action) {
      case "DISCOVER": {
        const { recipient } = parsedMessage.body;

        if (!map.has(recipient)) {
          ws.send({ status: "error", message: "Coudn't find recipient!" });
        } else {
          const { data } = parsedMessage.body;

          const message = JSON.stringify({
            action: "DISCOVER",
            status: "OK",
            body: {
              sender: request.session.userId,
              data,
            }
          });

          const socket = map.get(recipient);

          console.log(`Sending message to user  ${recipient}`)
          socket.send(message);
        }

        break;
      }

      case "DISCOVER-RESPONSE": {
        const { recipient } = parsedMessage.body;

        if (!map.has(recipient)) {
          ws.send({ status: "error", message: "Coudn't find recipient!" });
        } else {
          const { data } = parsedMessage.body;

          const message = JSON.stringify({
            action: "DISCOVER-RESPONSE",
            status: "OK",
            body: {
              sender: request.session.userId,
              data,
            }
          });

          const socket = map.get(recipient);

          console.log(`Sending message to user  ${recipient}`)
          socket.send(message);
        }

        break;
      }

      default:
        break;
    }
  });

  ws.on('close', function () {
    map.delete(userId);
  });
});

//
// Start the server.
//
server.listen(8080, function () {
  console.log('Listening on http://localhost:8080');
});


// app.ws("/signal", (ws, request) => {
//   console.log("ws")
//   console.log(request.headers.cookie)

//   sessionParser(request, {}, () => console.log(request.session))

//   const userId = request.session.userId;

//   map.set(userId, ws);

//   ws.on('message', (msg) => {
//     const parsedMessage = JSON.parse(msg);
//     console.log(`Received message from user ${userId}`);
//     // console.log(parsedMessage)

//     switch (parsedMessage.action) {
//       case "DISCOVER":
//         const { peer } = parsedMessage.body;

//         if (!map.has(peer)) {
//           ws.send({ status: "error", message: "Coudn't find peer!" });
//         } else {
//           const { data } = parsedMessage.body;

//           const message = JSON.stringify({
//             action: "DISCOVER",
//             body: {
//               data,
//             }
//           });

//           // console.log(message)

//           ws.send(message);
//         }

//         break;

//       default:
//         break;
//     }
//   });

//   ws.on('close', function () {
//     map.delete(userId);
//   });
// });

// app.listen(8080, () => console.log("listening"))
