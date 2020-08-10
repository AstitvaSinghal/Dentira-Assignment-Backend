const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
const assert = require("assert");
var faker = require("faker");
let db = null;
const connectMongo = () => {
  console.log("connecting server...");
  MongoClient.connect(url, async (err, client) => {
    assert.equal(err, null);
    db = await client.db("Aggregator");
    console.log("Connected correctly to server", db.databaseName);
    //for (let i = 0; i < 1000; i++) {
    //  db.collection("dishes")
    //    .insertOne({
    //      name: faker.random.words(),
    //      city: faker.address.city(),
    //      platform: "zomato",
    //    })
    //    .then((res) => {
    //      console.log(res.result);
    //    });
    //}
  });
};

const getDB = () => {
  return db;
};

module.exports = {
  getDB: getDB,
  connectMongo,
};
