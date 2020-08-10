const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const dboper = require("../operations/dboper");
const url = "mongodb://localhost:27017/";
const assert = require("assert");

let db = null;
var router = express.Router();
router.use(bodyParser.json());

router
  .route("/")
  .all((req, res, next) => {
    MongoClient.connect(url, (err, client) => {
      assert.equal(err, null);
      db = client.db("Aggregator");
      console.log("Connected correctly to server", db.databaseName);
      next();
    });
  })
  .get((req, res, next) => {
    //const coll = db.getCollection("dishes");
    //console.log("request initiated", JSON.stringify(req.body), db);
    console.log("query :", req.query);
    let criteria = {};
    if (req.query.name !== "" && req.query.name !== undefined) {
      criteria.name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.city) {
      criteria.city = { $regex: req.query.city, $options: "i" };
    }
    console.log("criteria", criteria);
    db.collection("dishes")
      .find(criteria)
      .toArray()
      .then((result) => {
        console.log("result", result);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(result);
      });
    //dboper.findDocuments(db, "dishes").then((result) => {

    //});
  })
  .post((req, res, next) => {
    console.log("request initiated", JSON.stringify(req.body));
    dboper.insertDocument(db, req.body, "dishes").then((result) => {
      console.log("inserted successfully");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(result);
    });
  })
  .put((req, res, next) => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Operation not supported");
  })
  .post((req, res, next) => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Operation not supported");
  });
module.exports = router;
