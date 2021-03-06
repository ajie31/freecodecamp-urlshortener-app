require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const shortid = require("shortid");
//*Use body-parser to Parse POST Requests
const bodyParser = require("body-parser");
const urlEncoded = bodyParser.urlencoded({ extended: false });

var validUrl = require("valid-url");
// Basic Configuration
const port = process.env.PORT || 3000;
//connect to mongoose atlas
const URI =
  "mongodb+srv://mongo_1:mongo_1@cluster0.kfcyu.mongodb.net/url_shortener?retryWrites=true&w=majority";
mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Schema Model Document and Collection

const modelURL = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: String,
});
const URL_collection = mongoose.model("URL", modelURL);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

//add new document to collection
const createAndSaveURL = async (original, short) => {
  let short_Url = new URL_collection({
    original_url: original,
    short_url: short,
  });
  short_Url = await short_Url.save();
};
// Post method below
app.use(urlEncoded);
app.post("/api/shorturl/new", async (req, res, next) => {
  const original_url = req.body.url;
  const short_url = shortid.generate();
  if (!validUrl.isUri(original_url)) {
    res.status(401).json({
      error: "invalid url",
    });
  } else {
    console.log("valid url = " + original_url);
    let findOne = await URL_collection.findOne({ original_url: original_url });
    if (findOne) {
      res.json({
        original_url: findOne.original_url,
        short_url: findOne.short_url,
      });
    } else {
      createAndSaveURL(original_url, short_url).catch(console.error).then(
        res.json({
          original_url,
          short_url,
        })
      );
    }
  }
});
// get short link
app.get("/api/shorturl/:short_url?", async (req, res) => {
  const url = await URL_collection.findOne({ short_url: req.params.short_url });
  if (!url) {
    res.status(404).json({
      error: "url not found = " + url.short_url,
    });
  } else {
    res.redirect(url.original_url);
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
