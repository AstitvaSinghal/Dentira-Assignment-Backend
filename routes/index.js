const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const dboper = require("../operations/dboper");
const url = "mongodb://localhost:27017/";
const assert = require("assert");

let db = null;
var router = express.Router();
router.use(bodyParser.json());
let axios = require("axios");
let cheerio = require("cheerio");
let fs = require("fs");
const { cities } = require("../latllng");
const SwiggyDishImageURL =
  "https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_208,h_208,c_fill/";
const scrapeURL = "https://www.zomato.com/";
const getZomato = (data, req, res, page) => {
  return new Promise((resolve, reject) => {
    const getZomatoData = async (data, req, res, page) => {
      console.log("page", page);
      await axios
        .get(
          scrapeURL +
            req.query.city +
            "/order-food-online?" +
            "q=" +
            req.query.name +
            "&page=" +
            page
        )
        .then(
          (response) => {
            if (response.status == 200) {
              //console.log(response.request._redirectable._currentUrl);

              const current_url = response.request._redirectable._currentUrl;
              if (page == 2 || current_url[current_url.length - 1] < page) {
                resolve(data);
              } else {
                const html = response.data;
                //console.log(html);
                const $ = cheerio.load(html);
                let promises = [];
                const check = new RegExp("(dishv2_id)+", "i");
                if (check.test(current_url)) {
                } else {
                }
                $("#orig-search-list")
                  .find(".search-result")
                  .each((i, elem) => {
                    //console.log(
                    //  $(elem).find(".result-order-flow-title").attr("href")
                    //);
                    const url = $(elem)
                      .find(".result-order-flow-title")
                      .attr("href");
                    if (url) {
                      promises.push(
                        parseZomatoRestaurantPage(url, req.query.name)
                      );
                    } else {
                      console.log(response.request._redirectable);
                    }
                    //data.push({
                    //title: $(elem)
                    //  .find(".result-order-flow-title")
                    //  .text()
                    //  .trim(),
                    //  url: $(elem)
                    //    .find(".result-order-flow-title")
                    //    .attr("href"),
                    //  //address: $(elem)
                    //  //  .find(".search-result-address")
                    //  //  .text()
                    //  //  .trim(),
                    //  //price: $(elem).find(".res-cost").text(),
                    //  platform: "Zomato",
                    //});
                  });
                Promise.all(promises).then((result) => {
                  data = [...data, ...result];
                  getZomatoData(data, req, res, page + 1);
                });
                //console.log(data);
              }
            }
          },
          (e) => {
            console.log(e);
          }
        );
    };

    getZomatoData(data, req, res, page);
  });
};
const parseZomatoRestaurantPage = (url, name) => {
  return new Promise((resolve, reject) => {
    axios.get(url).then((res) => {
      if (res.status == 200) {
        //console.log(res);
        const html = res.data;
        //console.log(html);
        const $ = cheerio.load(html);
        let dishes = [];
        //console.log("regex", "/" + name + "/i/");
        const regex = new RegExp("(" + name + ")+", "i");
        //console.log($("img").attr("src"));
        setTimeout(() => {
          $(".sc-1s0saks-15").each((i, elem) => {
            console.log($(elem).find("img").attr("data-cfsrc"));
            const dishName = $(elem).find("h4").text().trim();
            if (regex.test(dishName))
              dishes.push({
                name: dishName,
                price: $(elem).find(".sc-17hyc2s-1").text().trim(),
                imageURL: $(elem).find("img").attr("src"),
              });
          });
          //dishes=dishes.filter((item)=>regex.test(item.name))
          resolve({
            restaurant: $(".sc-7kepeu-0").text().trim(),
            dishes,
          });
        }, 5000);
      }
    });
  });
};

const getSwiggyData = (name, city) => {
  //const cityList=Object.keys(cities).forEach(item=>{})
  //const regex=new RegExp("city")
  //let selectedCity;
  //for(var i=0;i<cityList.length;i++)
  //{
  //  if(regex.test(city))
  //  {
  //    selectedCity=city
  //    break;
  //  }
  //}
  return new Promise((resolve, reject) => {
    const { lat, lng } = cities[city];
    axios
      .get(
        "https://www.swiggy.com/dapi/restaurants/search/v2_2?lat=" +
          lat +
          "&lng=" +
          lng +
          "&str=" +
          name +
          "&withMenuItems=true"
      )
      .then((res) => {
        if (res.status == 200) {
          let result = [];
          res.data.data.restaurants[0].restaurants.forEach((item) => {
            let obj = {};
            //console.log(item.slugs.restaurant);
            obj.restaurant = item.name;
            obj.dishes = item.menuItems.map((i) => {
              //console.log(i)
              return {
                name: i.name,
                price: i.price / 100,
                imageURL: i.cloudinaryImageId
                  ? SwiggyDishImageURL + i.cloudinaryImageId
                  : null,
              };
              //console.log(, i.price / 100, i.cloudinaryImageId);
            });
            result.push(obj);
          });
          //console.log(res.data.data.restaurants[2]);
          resolve(result);
        } else {
          resolve([]);
        }
      })
      .catch((e) => {
        console.log(e);
        return e;
      });
  });
};

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
  .get(async (req, res, next) => {
    if (!req.query.name || !req.query.city) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.end("Incomplete Data");
    } else {
      let restaurants = [];

      let zomatoData = getZomato(restaurants, req, res, 1);
      //console.log("Zomato Data", zomatoData);
      let swiggyData = getSwiggyData(req.query.name, req.query.city);
      Promise.all([zomatoData, swiggyData]).then((result) => {
        console.log("request resolving");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({
          zomato: result[0],
          swiggy: result[1],
        });
      });
    }
    //axios
    //  .get(
    //    scrapeURL +
    //      req.query.city +
    //      "/restaurants?" +
    //      "q=" +
    //      req.query.name +
    //      "&page=" +
    //      1
    //  )
    //  .then(
    //    (response) => {
    //      if (response.status == 200) {
    //        console.log(response.request._redirectable._currentUrl);
    //        //const current_url = response.request._redirectable._currentUrl;

    //        const html = response.data;
    //        //console.log(html);
    //        const $ = cheerio.load(html);
    //        $("#orig-search-list")
    //          .find(".search-result")
    //          .each((i, elem) => {
    //            restaurants.push({
    //              title: $(elem).find(".result-title").text().trim(),
    //              address: $(elem).find(".search-result-address").text().trim(),
    //              price: $(elem).find(".res-cost").text(),
    //              platform: "Zomato",
    //            });
    //          });
    //        console.log(restaurants);
    //        res.statusCode = 200;
    //        res.setHeader("Content-Type", "application/json");
    //        res.json(restaurants);
    //      }
    //    },
    //    (e) => {
    //      console.log(e);
    //    }
    //  );
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
