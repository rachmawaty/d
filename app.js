/*** Express Framework ***/
var express = require('express');
var app = express();

/*** Path and Filesystem ***/
app.path = require('path');
app.fs = require('fs');

app.async = require('async');
app.moment = require("moment");

/*** data connection***/
app.mongoStore = require('connect-mongo');
app.mongoose = require('mongoose');
app.mongoose.connect('mongodb://localhost:27017/dapp');

app.n3 = require('n3');
app.rdfstore = require('rdfstore');

app.dir = __dirname;
global.Async = app.async;
global.request = require('request');

app.set('views', app.path.join(__dirname, 'views'));
app.use(express.static(app.path.join(__dirname, 'public')));

/*** Pug ***/
app.set('view engine', 'pug');

var models = {};
models.categories = require('./models/categories')(app.mongoose).model;

var next = function() {
    app.listen(2525);
    console.log("Express server listening on port 2525");
    require('./routes/routes')(app, models);
};

next();

//port --> localhost:2525
// app.listen(2525, function(){
// 	console.log('Listening at port 2525');
// });