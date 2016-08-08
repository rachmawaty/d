var request = require('request');

module.exports = function(app, models){
	require('./misc')(app, models);
	var queries = require('./query')(app, models);

	var getCategoriesAndDatasets = function(callback){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function(parent_category, cb_parent){
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxName, function(err, children_categories){
					if (err) console.log(err);
					var c_categories = [];
					app.async.each(children_categories, function(child_category, cb_child){
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
				callback(err, categories);
			});
		});
	};

	var isDataset = function(param, callback){
		models.datasets.findByIdxName(param, function(err, dataset){
			if (dataset) {
				var params = [];
				params.push(param);
				callback(err, params);
			} else {
				callback(err, param);
			}
		});
	}

	var getData = function(params, callback){
		var results = [];
		app.async.each(params, function(param, cb_dt){
			models.datasets.findByIdxName(param, function(err, dataset){
				if (dataset){
					models.datasets.getQuery(dataset._id, function(err, query){
						if (err) console.log(err);
						var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

						app.http.get(api, function(res){
						    var body = '';

						    res.on('data', function(chunk){
						        body += chunk;
						    });

						    res.on('end', function(){
						        var dt = JSON.parse(body);
						        dt.results.dataId = dataset._id;
						        dt.results.title = dataset.label;
						        dt.results.chartAttributes = dataset.chartAttributes;
						        dt.results.mapAttributes = dataset.mapAttributes;
						        dt.results.rows = dt.results.bindings;
						        dt.results.attributes = dt.head.vars;
						        results.push(dt.results);
						        cb_dt();
						    });
						}).on('error', function(e){
						    console.log("Got an error: ", e);
						    cb_dt();
						});
					});
				} else {
					cb_dt();
				}
			});
		}, function(err){
			if (err) console.log(err);
			var chartData = [];
			app.async.each(results, function(result, cb_temp){
				var chart = {};
				chart.name = result.title;
				chart.type = "bar";
				chart.x = [];
				chart.y = [];
				app.async.each(result.bindings, function(row, cb_row){
					chart.x.push(row[result.chartAttributes.x].value);
					chart.y.push(row[result.chartAttributes.y].value);
					cb_row();
				}, function(err){
					if (err) console.log(err);
					chartData.push(chart);
					cb_temp();
				});
			}, function(err){
				if (err) console.log(err);
				results.chartData = chartData;
				callback(err, results);
			});
		});
	};

	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		var params = req.query.dataset;
		var categoryparam = req.query.category;
		console.log(categoryparam);
		app.async.parallel([
			function(callback){
				getCategoriesAndDatasets(function(err, categories){
					callback(err, categories);
				});
			}, function(callback){
				isDataset(params, function(err, datasets){
					getData(datasets, function(err, results){
						callback(err, results);
					});
				});
			}, function(callback){
				var split = categoryparam ? categoryparam.split("-") : "";
				console.log(split);
				var title = "";
				app.async.eachSeries(split, function(idxName, cb){
					models.categories.findByIdxName(idxName, function(err, category){
						if (err) console.log(err);
						var label = category.label + " ";
						title += label;
						cb();
					});
				}, function(err){
					if (err) console.log(err);
					var charts = {};
					charts.title = title;
					charts.xaxis = "Area";
					charts.yaxis = title.split(" ")[1];
					callback(err, charts);
				});
			}
		], function(err, results){
			if (err) console.log(error);
			res.render('index.pug', { 
				active: "home", 
				categories: results[0],
				ds: results[1],
				data: JSON.stringify(results[1].chartData),
				mapdata: JSON.stringify(results[1]),
				charts: JSON.stringify(results[2]),
				cat: categoryparam
			});
		});
	});

	app.get('/datasets', function(req, res){
		getCategoriesAndDatasets(function(err, categories){
			if (err) console.log(error);
			res.render('list.pug', { 
				active:"datasets", 
				categories: categories 
			});
		});
	});

	app.get('/about', function(req, res){
		res.render('about.pug', { active:"about" });
	});

	app.get('/endpoint', function(req, res){
		res.render('endpoint.pug', { active:"endpoint" });
	});
}