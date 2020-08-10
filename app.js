var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var dishRouter = require("./routes/index");

var app = express();
var cors = require("cors");
//mongo connect

//// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/dishes", dishRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

//  const db = client.db(dbname);
//  dboper
//    .insertDocument(db, { name: "Vadonut", description: "Test" }, "dishes")
//    .then((result) => {
//      console.log("Insert Document:\n", result.ops);

//      return dboper.findDocuments(db, "dishes");
//    })
//    .then((result) => {
//      console.log("Found Documents:\n", result);

//      return dboper.updateDocument(
//        db,
//        { name: "Vadonut" },
//        { description: "Updated Test" },
//        "dishes"
//      );
//    })
//    .then((result) => {
//      console.log("Updated Document:\n", result.result);

//      return dboper.findDocuments(db, "dishes");
//    })

//    .then((docs) => {
//      console.log("Found Updated Documents:\n", docs);

//      db.dropCollection("dishes", (result) => {
//        console.log("Dropped Collection: ", result);

//        client.close();
//      });
//    });
//});
