var request = require('request');

module.exports = function(app, models){
	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		res.render('index.pug', { active:"index" });
	});

	app.get('/visualisation', function(req, res){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function (parent_category, cb_parent) {
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxName, function(err, children_categories){
					if (err) console.log(err);
					var c_categories = [];
					app.async.each(children_categories, function (child_category, cb_child) {
						c_categories.push(child_category.toObject());
						cb_child();
					}, function(err){
						if (err) console.log(err);
						p_category.children = c_categories;
						categories.push(p_category);
						cb_parent();
					});
				});
			}, function (err) {
				if (err) console.log(error);
				res.render('visualisation.pug', { active:"visualisation", categories: categories });
			});
		});
	});

	app.get('/datasets', function(req, res){
		res.render('index.pug', { active:"datasets" });
	});

	app.get('/about', function(req, res){
		res.render('index.pug', { active:"about" });
	});

	require('./misc')(app, models);
}