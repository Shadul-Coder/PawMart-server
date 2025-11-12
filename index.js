const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@shadul.twf8c9s.mongodb.net/?appName=SHADUL`;

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    next();
  } catch (err) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

app.get("/", (req, res) => {
  res.send("PawMart Server Running");
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const pawmartDB = client.db("pawmartdb");
    const petssupplies = pawmartDB.collection("pets_and_supplies");
    const orders = pawmartDB.collection("orders");

    app.get("/pets-and-supplies/latest", async (req, res) => {
      const cursor = petssupplies
        .find()
        .project({ name: 1, category: 1, price: 1, location: 1, image: 1 })
        .sort({ date: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/pets-and-supplies", async (req, res) => {
      let { filter, search } = req.query;
      if (filter === "pets") filter = "Pets";
      if (filter === "foods") filter = "Foods";
      if (filter === "accessories") filter = "Accessories";
      if (filter === "care-products") filter = "Care Products";
      let query = {};
      if (filter) {
        query = { category: filter };
      }
      if (search) {
        query = { name: { $regex: search, $options: "i" } };
      }
      const cursor = petssupplies
        .find(query)
        .project({ name: 1, category: 1, price: 1, location: 1, image: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/pets-and-supplies/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petssupplies.findOne(query);
      res.send(result);
    });
    app.get("/pets-and-supplies/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.token_email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email };
      const cursor = petssupplies.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/pets-and-supplies", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await petssupplies.insertOne(data);
      res.send(result);
    });
    app.patch("/pets-and-supplies", verifyToken, async (req, res) => {
      const data = req.body;
      const query = { _id: new ObjectId(data.id) };
      const update = {
        $set: {
          name: data.name,
          price: data.price,
          location: data.location,
          description: data.description,
          image: data.image,
          date: data.date,
        },
      };
      const result = await petssupplies.updateOne(query, update);
      res.send(result);
    });
    app.delete("/pets-and-supplies/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petssupplies.deleteOne(query);
      res.send(result);
    });
    app.post("/orders", verifyToken, async (req, res) => {
      const data = req.body;
      const query = { productId: data.productId, email: data.email };
      const update = {
        $setOnInsert: {
          productName: data.productName,
          buyerName: data.buyerName,
          price: data.price,
          address: data.address,
          phone: data.phone,
          date: data.date,
          additionalNotes: data.additionalNotes,
        },
        $inc: { quantity: data.quantity },
      };
      const options = { upsert: true };
      const result = await orders.updateOne(query, update, options);
      res.send(result);
    });
    app.get("/orders/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.token_email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email };
      const cursor = orders.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
