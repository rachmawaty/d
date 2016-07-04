//Express Framework
var express = require('express');
var app = express();

//Path and Filesystem
var path = require('path');
var fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

//jsonld
var jsonld = require('jsonld');

//D3.js
var d3 = require('d3');
// var jsdom = require('jsdom');
// var document = jsdom.jsdom();
// var svg = d3.select(document.body).append("svg");

//homepage
app.get('/', function(req, res){
	res.sendFile('index.html', {root: path.join(__dirname, './views')});
});

app.get('/datasets', function(req, res){
	res.sendFile('datasets.html', {root: path.join(__dirname, './views')});
});

app.get('/visualisation', function(req, res){
	res.sendFile('visualisation.html', {root: path.join(__dirname, './views')});
});

app.get('/about', function(req, res){
	res.sendFile('about.html', {root: path.join(__dirname, './views')});
});

//port --> localhost:2525
app.listen(2525, function(){
	console.log('Listening at port 2525');
});