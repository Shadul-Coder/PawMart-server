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

    app.get("/pets&supplies", async (req, res) => {
      const cursor = petssupplies
        .find()
        .project({ name: 1, category: 1, price: 1, location: 1, image: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/pets&supplies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petssupplies.findOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
