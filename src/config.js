require("dotenv").config();
module.exports = {
  port: process.env.PORT || 3000,
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017",
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  JWT_SECRET: process.env.JWT_SECRET,
};