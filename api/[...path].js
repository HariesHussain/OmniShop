import serverless from "serverless-http";
import app from "../backend/minimalApp.js";
export default serverless(app);