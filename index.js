const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

const uri = "mongodb://localhost:27017";
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrpddgz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const volunteerCollection = client
      .db("volunteer")
      .collection("volunteer_post");

    // -------------------------------------------------------------volunteer_post api

    // get volunteer_post by id
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });

    // my post get by email
    app.get("/volunteer_post", async (req, res) => {
      console.log(req.query);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await volunteerCollection.find(query).toArray();
      res.send(result);
    });

    // post a volunteer_post
    app.post("/volunteer_post", async (req, res) => {
      // console.log(req.body);
      const volunteer_post = req.body;
      const result = await volunteerCollection.insertOne(volunteer_post);
      res.send(result);
    });

    // delete ap post by id
    app.delete("/volunteer_post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Volunteer Management server is running");
});

app.listen(port, () => {
  console.log(`Volunteer Management server is running on port ${port}`);
});
