//
// PasteNode - Pastebin-like service written in Node.js
//

const config = {
  /* Main */
  appurl: "https://pastenode-artur9010.c9users.io/", //url to your pastenode
  title: "PasteNode v0.0.4", //title in header
  description: "Free and Open Source pastebin alternative!", //subtitle in header
  /* MongoDB */
  mongourl: "" //database url in format: mongodb://username:password@host:port/database
};

const lang = {
  create_new_paste: "Create new paste",
  add: "Add"
};

// Code!

//mongodb
const MongoClient = require('mongodb').MongoClient;
var database;
MongoClient.connect(config.mongourl, function(err, db) {
  if (err) throw err;
  database = db;
  db.createCollection("nodepaste", function(err, res) {
    if (err) throw err;
  });
});

//other things
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use('/app/node_modules', express.static(__dirname + '/node_modules/'));
app.use('/app/public', express.static(__dirname + '/public/'));
app.set('views', './views');
app.set('view engine', 'pug');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//locals
app.locals.appurl = config.appurl;
app.locals.title = config.title;
app.locals.description = config.description;

app.get('/', function (req, res) {
  res.render('index', { create_new_paste: lang.create_new_paste, add: lang.add});
});

app.get('/paste/:id', function (req, res) {
  var query = {
    id: req.params.id
  };
  database.collection("nodepaste").findOne(query, function(err, result){
    console.log(result);
    if(err){
      throw err;
    }
    if(result != null){
      res.render('paste', { pasteid: result.id, pastetitle: result.name, pastecontent: result.content, pastesyntax: result.syntax});
    }else{
      res.render('404');
    }
  });
});

//crashes app.
app.get('/raw/:id', function (req, res) {
  var query = {
    id: req.params.id
  };
  database.collection("nodepaste").findOne(query, function(err, result){
    console.log(result);
    if(err){
      throw err;
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.send(result.content);
  });
});

app.post('/add', function (req, res) {
  var randomid = Math.random().toString(36).substr(2, 20);
  var paste = {
    id: randomid,
    name: req.body.name,
    syntax: req.body.syntax,
    content: req.body.content
  };
  database.collection("nodepaste").insertOne(paste, function(err, res){
    if(err) throw err;
    console.log("Paste with id " + randomid + " added.");
  });
  //res.send("Paste with id " + randomid + " added."); //todo: redirect to paste.
  res.send("added, url:  " + config.appurl + "paste/" + randomid + "");
});

// 404
app.get('*', function(req, res){
  res.render('404');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});
