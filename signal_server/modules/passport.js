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
      usernameField: "username",
      passwordField: "password",
    },
    async (username, pass, done) => {
      if (username && pass) {
        const user = await getUser({ username });

        if (!user) {
          return done(null, false, {
            message: "Incorrect username.",
          });
        }

        if (!bcrypt.compareSync(pass, user.password)) {
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
