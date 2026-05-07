import express from "express";
const app = express();
app.get("/test", (req, res) => {
  res.json({
    success: true,
    express: true,
    isolated: true
  });
});
export default app;