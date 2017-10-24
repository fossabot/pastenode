//
// PasteNode - Pastebin-like service written in Node.js
//

const config = {
    title: "PasteNode v0.0.1"
};

const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
app.use('/app/node_modules', express.static(__dirname + '/node_modules/'));
app.use('/app/public', express.static(__dirname + '/public/'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  res.render('index', { title: config.title});
});

app.get('/paste/:id', function (req, res) {
  res.render('paste', { title: config.title, pastetitle: "Name of paste!", pastecontent: "Content of paste!", pastelang: "js"});
});

app.post('/add', function (req, res) {
  res.send('Got a POST request');
});

// 404
app.get('*', function(req, res){
  res.render('404');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});
