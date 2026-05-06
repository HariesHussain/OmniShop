import serverless from 'serverless-http';
import app from '../backend/server.js';

// Wrap the existing Express app with serverless-http and export as default handler
const handler = serverless(app);

export default handler;
