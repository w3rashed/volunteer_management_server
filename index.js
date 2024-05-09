const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;















app.get("/", (req, res) => {
  res.send("Volunteer Management server is running");
});

app.listen(port, () => {
  console.log(`Volunteer Management server is running on port ${port}`);
});
