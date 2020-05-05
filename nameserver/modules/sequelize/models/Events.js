module.exports = (sequelize, type) => {
  const Event = sequelize.define(
    "Event",
    {
      type: {

      },
      seen: {

      },




      username: {
        type: type.STRING,
        primaryKey: true,
        validate: {
          len: (value) => {
            if (value.length < 5) {
              throw Error("Username length must be bigger than 5");
            }
          },
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
      email: {
        type: type.STRING,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
        unique: true,
      },
    }
  );

  return Event;
};
