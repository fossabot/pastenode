//
// PasteNode - Pastebin-like service written in Node.js
//

//some node modules
const yaml = require('js-yaml');
const fs = require('fs');

//config
try {
  var config = yaml.safeLoad(fs.readFileSync(__dirname + '/config.yml', 'utf8'));
  console.log(config);
} catch (e) {
  console.log(e);
}

//mongodb
const mongodb = require('mongodb');
var database;
mongodb.MongoClient.connect(config['app']['database'], function(err, db) {
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
app.locals.appurl = config['app']['url'];
app.locals.title = config['app']['title'];
app.locals.subtitle = config['app']['subtitle'];

//index page
app.get('/', function (req, res) {
  res.render('index', { new_paste: config['language']['new_paste'], add: config['language']['add']});
});

//paste page
app.get('/paste/:id', function (req, res) {
  var query = {
    _id: mongodb.ObjectId(req.params.id)
  };
  database.collection("nodepaste").findOne(query, function(err, result){
    console.log(result);
    if(err){
      throw err;
    }
    if(result != null){
      res.render('paste', { pasteid: result._id, pastetitle: result.name, pastecontent: result.content, pastesyntax: result.syntax});
    }else{
      res.render('404');
    }
  });
});

//crashes app.
app.get('/raw/:id', function (req, res) {
  var query = {
    _id: mongodb.ObjectId(req.params.id)
  };
  database.collection("nodepaste").findOne(query, function(err, result){
    console.log(result);
    if(err){
      throw err;
    }
    if(result != null){
      res.send(result.content); //todo: send it as text, not html
    }else{
      res.render('404');
    }
  });
});

app.post('/add', function (req, res) {
  var paste = {
    name: req.body.name,
    syntax: req.body.syntax,
    content: req.body.content
  };
  database.collection("nodepaste").insertOne(paste, function(err, respond){
    if(err) throw err;
    var id = respond.ops[0]._id;
    console.log("Paste with id " + id + " added.");
    res.set('Location' , config['app']['url'] + "paste/" + id );
    res.render('newpasteredirect', {url: config['app']['url'] + "paste/" + id});
  });
});

// 404
app.get('*', function(req, res){
  res.render('404');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});
