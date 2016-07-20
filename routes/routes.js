var request = require('request');

module.exports = function(app, models){
	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function (parent_category, cb_parent) {
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxName, function(err, children_categories){
					if (err) console.log(err);
					var c_categories = [];
					app.async.each(children_categories, function (child_category, cb_child) {
						var c_category = child_category.toObject();	
						models.datasets.findByCategoryId(c_category._id, function(err, datasets){
							if (err) console.log(err);
							var c_datasets = [];
							app.async.each(datasets, function(dataset, cb_dts){
								c_datasets.push(dataset.toObject());
								cb_dts();
							}, function(err){
								c_category.datasets = c_datasets;
								c_categories.push(c_category);
								cb_child();
							});
						});
					}, function(err){
						if (err) console.log(err);
						p_category.children = c_categories;
						categories.push(p_category);
						cb_parent();
					});
				});
			}, function (err) {
				if (err) console.log(error);
				res.render('visualisation.pug', { active:"home", categories: categories });
			});
		});
	});

	app.get('/datasets', function(req, res){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function (parent_category, cb_parent) {
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxName, function(err, children_categories){
					if (err) console.log(err);
					var c_categories = [];
					app.async.each(children_categories, function (child_category, cb_child) {
						var c_category = child_category.toObject();	
						models.datasets.findByCategoryId(c_category._id, function(err, datasets){
							if (err) console.log(err);
							var c_datasets = [];
							app.async.each(datasets, function(dataset, cb_dts){
								c_datasets.push(dataset.toObject());
								cb_dts();
							}, function(err){
								c_category.datasets = c_datasets;
								c_categories.push(c_category);
								cb_child();
							});
						});
					}, function(err){
						if (err) console.log(err);
						p_category.children = c_categories;
						categories.push(p_category);
						cb_parent();
					});
				});
			}, function (err) {
				if (err) console.log(error);
				res.render('list.pug', { active:"datasets", categories: categories });
			});
		});
	});

	app.get('/about', function(req, res){
		res.render('index.pug', { active:"about" });
	});

	app.get('/filter', function(req, res){
		res.send("200");
	});

	require('./misc')(app, models);
}