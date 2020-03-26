const express = require('express');
const session = require('express-session');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const passport = require("./modules/passport");
const { User } = require("./modules/sequelize");


const app = express();

const socketMap = new Map();


const sessionParser = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
});

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.post("/login", passport.authenticate("local"), (req, res) => {
  if (req.body.remember) {
    res.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  } else {
    res.cookie.expires = false;
    req.session.cookie.expires = false;
  }

  console.log("login")
  console.log(req.session)

  res.status(202).json({ message: "ok" });
});

app.post("/signup", async (req, res) => {
  try {
    // FIXME check if body has exactly the required fields so we don't get hacked!
    // if (Object.values(req.body) !==) {

    // }

    if (!req.body.username) {
      res.status(406).json({ message: "missing username" });
      // } else if (!req.body.email) {
      //   res.status(406).json({ message: "missing email" });
    } else if (!req.body.password) {
      res.status(406).json({ message: "missing password" });
    } else {
      await User.create(req.body);

      res.status(201).json({ message: "user created" });
    }
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "server error" });
  }
});

app.delete("/logout", (req, res) => {
  res.cookie.expires = false;
  req.session.cookie.expires = false;

  const { id } = req.user;

  if (socketMap.has(id)) {
    const webSocket = socketMap.get(id);

    webSocket.close();

    socketMap.delete(id);
  }

  req.logout();
  res.redirect("/");
});


const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session || !request.session.passport || !request.session.passport.user) {
      console.log("session not found!");

      // TODO send a message to show in the request panel as failed, ex:
      // const SOCKET_NOT_AUTHENICATED_CODE = 4001;
      // const SOCKET_NOT_AUTHENICATED_MESSAGE = 'HTTP/1.1 401 Web Socket Protocol Handshake\r\n' +
      //   'Upgrade: WebSocket\r\n' +
      //   'Connection: Upgrade\r\n' +
      //   '\r\n';

      socket.destroy();
    } else {
      console.log('Session is parsed!');

      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
      });
    }
  });
});

wss.on('connection', function (ws, request) {
  console.log(request.user);
  console.log(request.session);

  // const { id } = request.user;

  // socketMap.set(id, ws);

  // ws.on('message', (msg) => {
  //   const parsedMessage = JSON.parse(msg);
  //   console.log(`Received message from user ${id}`);

  //   switch (parsedMessage.action) {
  //     case "DISCOVER": {
  //       const { recipient } = parsedMessage.body;

  //       if (!map.has(recipient)) {
  //         ws.send({ status: "error", message: "Coudn't find recipient!" });
  //       } else {
  //         const { data } = parsedMessage.body;

  //         const message = JSON.stringify({
  //           action: "DISCOVER",
  //           status: "OK",
  //           body: {
  //             sender: request.session.id,
  //             data,
  //           }
  //         });

  //         const socket = map.get(recipient);

  //         console.log(`Sending message to user  ${recipient}`)
  //         socket.send(message);
  //       }

  //       break;
  //     }

  //     case "DISCOVER-RESPONSE": {
  //       const { recipient } = parsedMessage.body;

  //       if (!map.has(recipient)) {
  //         ws.send({ status: "error", message: "Coudn't find recipient!" });
  //       } else {
  //         const { data } = parsedMessage.body;

  //         const message = JSON.stringify({
  //           action: "DISCOVER-RESPONSE",
  //           status: "OK",
  //           body: {
  //             sender: request.session.id,
  //             data,
  //           }
  //         });

  //         const socket = map.get(recipient);

  //         console.log(`Sending message to user  ${recipient}`)
  //         socket.send(message);
  //       }

  //       break;
  //     }

  //     default:
  //       break;
  //   }
  // });

  ws.on('close', function () {
    socketMap.delete(userId);
  });
});

//
// Start the server.
//
server.listen(8080, function () {
  console.log('Listening on http://localhost:8080');
});

