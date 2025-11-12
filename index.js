const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@shadul.twf8c9s.mongodb.net/?appName=SHADUL`;

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

    app.get("/pets-and-supplies", async (req, res) => {
      let { filter, search, email } = req.query;
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
      if (email) {
        query = { email };
      }
      let cursor;
      if (email) {
        cursor = petssupplies.find(query);
      } else {
        cursor = petssupplies
          .find(query)
          .project({ name: 1, category: 1, price: 1, location: 1, image: 1 });
      }
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/pets-and-supplies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petssupplies.findOne(query);
      res.send(result);
    });
    app.post("/pets-and-supplies", async (req, res) => {
      const data = req.body;
      const result = await petssupplies.insertOne(data);
      res.send(result);
    });
    app.patch("/pets-and-supplies", async (req, res) => {
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
    app.delete("/pets-and-supplies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petssupplies.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
