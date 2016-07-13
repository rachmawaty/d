var request = require('request');

module.exports = function(app){
	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		res.render('main.pug', res.status(200));
	});
}