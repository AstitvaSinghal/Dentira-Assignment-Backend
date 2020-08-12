let axios = require("axios");
let cheerio = require("cheerio");
let fs = require("fs");
const url = "https://www.zomato.com/agra/restaurants?q=paneer";
axios.get(url).then(
  (res) => {
    if (res.status == 200) {
      const html = res.data;
      const $ = cheerio.load(html);
    }
  },
  (e) => {
    console.log(e);
  }
);
