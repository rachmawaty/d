/*** Express Framework ***/
var express = require('express');
var app = express();

// var config = require('./config.js')(app, express);

/*** Path and Filesystem ***/
app.path = require('path');
app.fs = require('fs');

// app.use(express.compress());
app.set('views', app.path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(app.path.join(__dirname, 'public')));
// app.use(bodyParser.json());

// jsonld
// var jsonld = require('jsonld');

//D3.js
// var d3 = require('d3');
// var jsdom = require('jsdom');
// var document = jsdom.jsdom();
// var svg = d3.select(document.body).append("svg");

var next = function() {
    app.listen(2525);
    console.log("Express server listening on port 2525");
    require('./routes/routes')(app);
};

next();

//homepage
// app.get('/', function(req, res){
// 	res.sendFile('index.html', {root: app.path.join(__dirname, './views')});
// });

app.get('/datasets', function(req, res){
	res.sendFile('datasets.html', {root: app.path.join(__dirname, './views')});
});

app.get('/visualisation', function(req, res){
	res.sendFile('visualisation.html', {root: app.path.join(__dirname, './views')});
});

app.get('/about', function(req, res){
	res.sendFile('about.html', {root: app.path.join(__dirname, './views')});
});

//port --> localhost:2525
// app.listen(2525, function(){
// 	console.log('Listening at port 2525');
// });