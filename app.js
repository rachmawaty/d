/*** Express Framework ***/
var express = require('express');
var app = express();

/*** Path and Filesystem ***/
app.path = require('path');
app.fs = require('fs');

app.promise = require('promise');
app.async = require('async');
app.moment = require("moment");

/*** data connection ***/
app.mongoStore = require('connect-mongo');
app.mongoose = require('mongoose');
// app.mongoose.connect('mongodb://localhost:27017/dapp');
app.mongoose.connect('mongodb://localhost:27017/dapp2');

/*** visualisation ***/
// app.plotly = require('plotly')("rachmawaty", "7x4q8r5vid");

app.http = require('http');

app.dir = __dirname;
global.Async = app.async;
global.request = require('request');

app.set('views', app.path.join(__dirname, 'views'));
app.use(express.static(app.path.join(__dirname, 'public')));

/*** Pug ***/
app.set('view engine', 'pug');

var models = {};
models.categories = require('./models/categories')(app.mongoose).model;
models.datasets = require('./models/datasets')(app.mongoose).model;
models.visualisations = require('./models/visualisations')(app.mongoose).model;
models.items = require('./models/items')(app.mongoose).model;
models.categories2 = require('./models/categories2')(app).model;
models.datasets2 = require('./models/datasets2')(app).model;
models.visualisations2 = require('./models/visualisations2')(app).model;

var next = function() {
    app.listen(2525);
    console.log("Express server listening on port 2525");
    require('./routes/routes')(app, models);
};

next();