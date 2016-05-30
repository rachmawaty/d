//Express Framework
var express = require('express');
var app = express();

//Path and Filesystem
var path = require('path');
var fs = require('fs');

//D3.js
var d3 = require('d3');
var jsdom = require('jsdom');
var document = jsdom.jsdom();
var svg = d3.select(document.body).append("svg");


//homepage
app.get('/', function(req, res){
	res.sendFile('index.html', {root: path.join(__dirname, './views')});
});

//port --> localhost:2525
app.listen(2525, function(){
	console.log('Listening at port 2525');
});