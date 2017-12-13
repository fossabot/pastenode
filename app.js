//
// PasteNode - Pastebin-like service written in Node.js
//
const yaml = require('js-yaml');
const fs = require('fs');

//config
try {
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

//index page
app.get('/', function(req, res) {
	res.render('page/index', {
		recaptcha_site_key: config['recaptcha']['site_key']
	});
});

//paste page
app.get('/:id', function(req, res) {
	var query = {
		_id: mongodb.ObjectId(req.params.id)
	};
	database.collection("nodepaste").findOne(query, function(err, result) {
		//console.log(result);
		if (err) {
			throw err;
		}
		if (result != null) {
			res.render('page/paste', {
				paste_id: result._id,
				paste_content: result.content,
				paste_syntax: result.syntax
			});
		}
		else {
			res.render('error/404');
		}
	});
});

app.get('/:id/raw', function(req, res) {
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
			res.render('error/404');
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
	if(paste.delete_password.length > 128){
		throw "Paste delete password length is higher than 128.";
	}
	recaptcha.validateRequest(req).then(function() {
			database.collection("nodepaste").insertOne(paste, function(err, respond) {
				if (err) throw err;
				var id = respond.ops[0]._id;
				console.log("Paste with id " + id + " added.");
				//res.set('Location', config['app']['url'] + "paste/" + id);
				//res.render('newpasteredirect', { url: config['app']['url'] + "paste/" + id });
				res.location('/' + id);
				res.send("Redirecting...");
				res.end();
			});
		})
		.catch(function(errorCodes) {
			res.render('error/500', { error: recaptcha.translateErrors(errorCodes) });
		});
});

app.get("/:id/delete", function(req, res){
	throw "Not implemented yet.";
});

app.get("/:id/embed", function(req, res){
	var query = {
		_id: mongodb.ObjectId(req.params.id)
	};
	database.collection("nodepaste").findOne(query, function(err, result) {
		//console.log(result);
		if (err) {
			throw err;
		}
		if (result != null) {
			res.render('page/embed', {
				paste_id: result._id,
				paste_content: result.content,
				paste_syntax: result.syntax
			});
		}
		else {
			res.render('error/404');
		}
	});
});

// 404
app.get('*', function(req, res) {
	res.render('error/404');
});

//error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error/500', { error: err });
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {

});