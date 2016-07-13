/*** Express Framework ***/
var express = require('express');
var app = express();

/*** Path and Filesystem ***/
app.path = require('path');
app.fs = require('fs');

app.set('views', app.path.join(__dirname, 'views'));
app.use(express.static(app.path.join(__dirname, 'public')));

/*** Pug ***/
app.set('view engine', 'pug');

var next = function() {
    app.listen(2525);
    console.log("Express server listening on port 2525");
    require('./routes/routes')(app);
};

next();

//port --> localhost:2525
// app.listen(2525, function(){
// 	console.log('Listening at port 2525');
// });