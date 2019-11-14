require("dotenv/config");

module.exports = {
  dialect: "postgres",
  host: process.env.DB_HOST,
  url: process.env.DATABASE_URL,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true
  }
};
