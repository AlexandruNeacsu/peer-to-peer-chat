const Sequelize = require("sequelize");
const UserModel = require("./models/User");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    // pool: {
    //   max: 10,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000,
    // },
  },
);

const User = UserModel(sequelize, Sequelize);

// TODO
sequelize.sync({ force: false }).then(() => {
  console.log("Database sync completed!");
});

module.exports = {
  User,
};
