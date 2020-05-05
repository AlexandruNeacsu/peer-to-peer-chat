const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { User } = require("./sequelize");

const getUser = async (user) => User.findOne({
  where: user,
});

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "peerId",
      passwordField: "password",
    },
    async (peerId, password, done) => {
      if (peerId && password) {
        const user = await getUser({ peerId });

        if (!user) {
          return done(null, false, {
            message: "Incorrect peerId.",
          });
        }

        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, {
            message: "Incorrect password.",
          });
        }

        return done(null, user);
      }

      return done(null, null);
    },
  ),
);

passport.serializeUser((user, cb) => cb(null, user));

passport.deserializeUser((obj, cb) => cb(null, obj));

module.exports = passport;
