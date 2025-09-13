import express from "express";
import interactions from "./api/interactions.js";

const app = express();

// Middleware to keep raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // store as Buffer, not string
    },
  })
);

app.post("/interactions", interactions);
app.get("/", (req, res) => {
  res.send("✅ Bot is alive!");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

