//
// PasteNode - Pastebin-like service written in Node.js
//

//some node modules
const yaml = require('js-yaml');
const fs = require('fs');

//config
try {
	//todo: load example config and change some items with items from config.yml
	var config = yaml.safeLoad(fs.readFileSync(__dirname + '/config.yml', 'utf8'));
}
catch (e) {
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

//recaptcha
var reCAPTCHA = require('recaptcha2');
var recaptcha = new reCAPTCHA({
	siteKey: config['recaptcha']['site_key'],
	secretKey: config['recaptcha']['secret_key']
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
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({limit: '2mb', extended: true}));

//locals
app.locals.appurl = config['app']['url'];
app.locals.title = config['app']['title'];
app.locals.subtitle = config['app']['subtitle'];

//index page
app.get('/', function(req, res) {
	res.render('index', {
		index_new_paste: config['language']['index_new_paste'],
		index_name: config['language']['index_name'],
		index_syntax: config['language']['index_syntax'],
		index_delete_password: config['language']['index_delete_password'],
		index_content: config['language']['index_content'],
		index_captcha: config['language']['index_captcha'],
		index_add: config['language']['index_add'],
		recaptcha_site_key: config['recaptcha']['site_key']
	});
});

//paste page
app.get('/paste/:id', function(req, res) {
	var query = {
		_id: mongodb.ObjectId(req.params.id)
	};
	database.collection("nodepaste").findOne(query, function(err, result) {
		//console.log(result);
		if (err) {
			throw err;
		}
		if (result != null) {
			res.render('paste', {
				pasteid: result._id,
				pastetitle: result.name,
				pastecontent: result.content,
				pastesyntax: result.syntax,
				paste_raw: config['language']['paste_raw'],
				paste_delete: config['language']['paste_delete'],
				paste_delete_confirm: config['language']['paste_delete_confirm'],
				paste_delete_password: config['language']['paste_delete_password']
			});
		}
		else {
			res.render('404');
		}
	});
});

app.get('/raw/:id', function(req, res) {
	var query = {
		_id: mongodb.ObjectId(req.params.id)
	};
	database.collection("nodepaste").findOne(query, function(err, result) {
		if (err) {
			throw err;
		}
		if (result != null) {
			res.type('text/plain; charset=utf-8').send(result.content);
		}
		else {
			res.render('404');
		}
	});
});

app.post('/add', function(req, res) {
	var paste = {
		name: req.body.name,
		syntax: req.body.syntax,
		content: req.body.content,
		delete_password: req.body.delete_password
	};
	//some verifications
	if(paste.name == ''){
		throw "Paste title is empty";
	}
	if(paste.name.length < 3){
		throw "Paste title length is smaller than 3.";
	}
	if(paste.name.length > 250){
		throw "Paste title length is higher than 250.";
	}
	if(paste.syntax == ''){
		throw "Paste syntax is empty";
	}
	if(paste.syntax.length > 64){
		throw "Paste syntax length is higher than 64.";
	}
	if(paste.content == ''){
		throw "Paste content is empty";
	}
	if(paste.content.length > 250000){
		throw "Paste content length is higher than 250000.";
	}
	if(paste.delete_password.length > 32){
		throw "Paste delete password length is higher than 32.";
	}
	recaptcha.validateRequest(req).then(function() {
			database.collection("nodepaste").insertOne(paste, function(err, respond) {
				if (err) throw err;
				var id = respond.ops[0]._id;
				console.log("Paste with id " + id + " added.");
				res.set('Location', config['app']['url'] + "paste/" + id);
				res.render('newpasteredirect', { url: config['app']['url'] + "paste/" + id });
			});
		})
		.catch(function(errorCodes) {
			res.render('error', { error: recaptcha.translateErrors(errorCodes) });
		});
});

app.post("/delete", function(req, res){
	//throw "Not implemented yet.";
	var query = {
		_id: mongodb.ObjectId(req.body.id),
		delete_password: req.body.delete_password
	};
	console.log(query);
	if(query._id == ''){
		throw "Paste ID is empty.";
	}
	if(query.delete_password == ''){
		throw "Delete password is empty.";
	}
	if(query.delete_password.length > 32){
		throw "Delete password length is higher than 32.";
	}
	throw "Not implemented yet.";
});

app.get("/embed/:id", function(req, res){
	throw "Not implemented yet.";
});

// 404
app.get('*', function(req, res) {
	res.render('404');
});

//error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', { error: err });
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {

});
