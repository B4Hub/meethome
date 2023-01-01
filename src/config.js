require("dotenv").config();
module.exports = {
  port: process.env.PORT || 80,
  mongoUrl: process.env.MONGO_URL,
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  JWT_SECRET: process.env.JWT_SECRET
};