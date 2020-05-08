const express = require('express');
const session = require('express-session');
const cors = require('cors');

const SequelizeUniqueConstraintError = require("sequelize/lib/errors/validation/unique-constraint-error");

const passport = require("./modules/passport");
const { User, Op } = require("./modules/sequelize");

// TODO find users by id, so a user can change the username(store the id on the client)
// TODO maybe use JWT?

const app = express();

const sessionParser = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
});

const whitelist = ["http://localhost:3000", "http://192.168.1.2:3000"];

const corsOptions = {
  origin: (origin, callback) => {
    console.log(origin)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}

app.use(cors(corsOptions));
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// login is done by peerId
app.post("/login", passport.authenticate("local"), (req, res) => {
  if (req.body.remember) {
    res.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  } else {
    res.cookie.expires = false;
    req.session.cookie.expires = false;
  }

  res.status(202).json({ message: "ok" });
});

app.delete("/logout", (req, res) => {
  res.cookie.expires = false;
  req.session.cookie.expires = false;

  req.logout();
  res.redirect("/");
});

app.post("/signup", async (req, res) => {
  try {
    const { username, password, peerId } = req.body;

    if (!username) res.status(406).json({ message: "missing username" })
    else if (!password) res.status(406).json({ message: "missing password" })
    else if (!peerId) res.status(406).json({ message: "missing peerId" })
    else {
      const alreadyExists = await User.findAll({
        where: {
          [Op.or]: [{ username }, { peerId }],
        },
      });

      if (alreadyExists.length) {
        res.status(403).json({
          success: false,
          message: "Username or peerId is already in use",
          username,
          peerId,
        });
      } else {
        await User.create({ peerId, username, password });

        res.status(201).json({ success: true, message: "user created" });
      }
    }
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "server error" });
  }
});


async function findByKey(req, res, searchKey, returnKey) {
  try {
    const user = await User.findOne({
      where: {
        [searchKey]: req.params[searchKey],
      },
    });

    if (user) res.status(200).json({ [returnKey]: user[returnKey] });
    else res.status(404).json({ message: `${key} not registered` });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "server error" });
  }
}

app.get("/username/:username", async (req, res) => findByKey(req, res, "username", "peerId"));

app.get("/peerId/:peerId", async (req, res) => findByKey(req, res, "peerId", "username"));

app.get("/check/username/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        username: req.params.username,
      },
    });

    if (user) res.status(200).json({ success: false, message: "Username is not available." });
    else res.status(200).json({ success: true, message: "Username is available." });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: "server error" });
  }
});

app.post("/username/:username", async (req, res) => {
  const { username } = req.params;

  try {
    if (!username) {
      res.status(400).json({ success: false, message: `Missing ${username}` });
    } else {
      const user = await User.findByPk(req.user.id);

      if (!user) {
        res.status(400).json({ success: false, message: "User not found!" });
      } else {
        await user.update({ username });

        res.status(200).json({ success: true });
      }
    }
  } catch (err) {
    if (err instanceof SequelizeUniqueConstraintError) {
      res.status(403).json({
          success: false,
          username,
        }
      );
    } else {
      console.error(err);

      res.status(500).json({ message: "server error" });
    }
  }
});


app.listen(8080, "0.0.0.0", () => console.log(`Listening on http://localhost:${8080}`)); // TODO: port

