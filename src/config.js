require("dotenv").config();
module.exports = {
  port: process.env.PORT || 80,
  mongoUrl: process.env.MONGO_URL|| "mongodb+srv://admin:team_escr@meethome.lqy171y.mongodb.net/?retryWrites=true&w=majority",
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "985697523517-dkp2f6qrf6bo51mi8416mj3e41jcvpm9.apps.googleusercontent.com",
  JWT_SECRET: process.env.JWT_SECRET ||"team_escr"
};