var request = require('request');

module.exports = function(app){
	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		res.render('index.pug', { active:"index" });
	});

	app.get('/visualisation', function(req, res){
		res.render('visualisation.pug', { active:"visualisation" });
	});

	app.get('/datasets', function(req, res){
		res.render('datasets.pug', { active:"datasets" });
	});

	app.get('/about', function(req, res){
		res.render('about.pug', { active:"about" });
	});

	app.get('/table', function(req, res){
		res.render('table.pug');
	});
}