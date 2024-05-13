const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://volunteer-management-6ebc4.web.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// --------------------------------------------cookie middleware
app.use(cookieParser());
const logger = (req, res, next) => {
  console.log("log:info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("token from middleware", token);
  //   no token available
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

// const uri = "mongodb://localhost:27017";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrpddgz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// --------------------------------cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    const volunteerCollection = client
      .db("volunteer")
      .collection("volunteer_post");

    const beAVolunteerCollection = client
      .db("volunteer")
      .collection("be_a_volunteer");
    // -----------------------------------------------------------auth related api
    // add token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    // token remove from cookies when user logged out
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("log out user", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // ----------------------------------------services related api-----------volunteer_post api

    // get volunteer_post by id
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });

    // geet all volunteer post
    app.get("/all_volunteer_post", async (req, res) => {
      let query = {};
      // search operation
      if (req.query?.title) {
        query = { title: req.query.title };
      }
      const result = await volunteerCollection.find(query).toArray();
      res.send(result);
    });

    // my post get by email && serch by title
    app.get("/volunteer_post", verifyToken, async (req, res) => {
      // console.log(req.query);
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

    // for sorting data by deadline
    app.get("/sort_post", async (req, res) => {
      try {
        const cursor = volunteerCollection.find();
        cursor.sort({ deadline: 1 });
        const result = await cursor.toArray();
        res.json(result);
        console.log(result);
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Server error" });
      }
    });

    // update a post by id
    app.patch("/volunteer_post/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upset: true };
      const updatePost = req.body;
      const updateDoc = {
        $set: {
          thumbnail: updatePost.thumbnail,
          title: updatePost.title,
          description: updatePost.description,
          category: updatePost.category,
          location: updatePost.location,
          volunteersNeeded: updatePost.volunteersNeeded,
          deadline: updatePost.deadline,
          name: updatePost.name,
          email: updatePost.email,
        },
      };
      const result = await volunteerCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // // delete a post by id
    app.delete("/volunteer_post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });

    // ------------------------------------------------------------request be a volunteer
    app.patch("/updateChanges/:id", async (req, res) => {
      const id = req.params.id;
      // const data = { _id: new ObjectId(id) };
      const options = { $inc: { volunteersNeeded: -1 } };
      const result = await volunteerCollection.updateOne(
        { _id: new ObjectId(id) },
        options
      );

      res.send(result);
    });
    app.patch("/updateCancleRequest/:id", async (req, res) => {
      const id = req.params.id;
      // const data = { _id: new ObjectId(id) };
      const options = { $inc: { volunteersNeeded: +1 } };
      const result = await volunteerCollection.updateOne(
        { _id: new ObjectId(id) },
        options
      );

      res.send(result);
    });
    // post a volunteer
    app.patch("/be_volunteer", async (req, res) => {
      const be_volunteer = req.body;
      const result = await beAVolunteerCollection.insertOne(be_volunteer);
      res.send(result);
    });

    // get all be a volunter by user email
    app.get("/be_volunteer", verifyToken, async (req, res) => {
      console.log(req.query);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await beAVolunteerCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/be_volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await beAVolunteerCollection.deleteOne(query);
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
