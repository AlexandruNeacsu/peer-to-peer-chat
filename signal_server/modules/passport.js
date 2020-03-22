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
      usernameField: "email",
      passwordField: "password",
    },
    async (email, pass, done) => {
      if (email && pass) {
        const user = await getUser({ email });

        if (!user) {
          return done(null, false, {
            message: "Incorrect email.",
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
