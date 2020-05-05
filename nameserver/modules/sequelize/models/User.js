const bcrypt = require("bcrypt");

const saltRounds = parseInt(process.env.SALT_ROUNDS, 10);

module.exports = (sequelize, type) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      peerId: {
        type: type.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      username: {
        type: type.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [5, 32],
        },
      },
      password: {
        type: type.STRING,
        allowNull: false,
      },
      sessionId: {
        type: type.STRING,
        allowNull: true,
        validate: {
          notEmpty: true,
        },
      },
    }
  );

  User.addHook("beforeCreate", (user) => {
    // eslint-disable-next-line no-param-reassign
    user.password = bcrypt.hashSync(
      user.password,
      bcrypt.genSaltSync(saltRounds),
      null,
    );
  });

  return User;
};
