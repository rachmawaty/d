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

	var getTableData = function(params, callback){
		var results = [];
		app.async.each(params, function(param, cb_dt){
			models.datasets.findByIdxName(param, function(err, dataset){
				if (dataset){
					queries.getTableQuery(dataset, function(err, query){
						var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

						app.http.get(api, function(res){
						    var body = '';

						    res.on('data', function(chunk){
						        body += chunk;
						    });

						    res.on('end', function(){
						        var dt = JSON.parse(body);
						        dt.results.title = dataset.label;
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
			callback(err, results);
		});
	};

	var getMapData = function(callback){
		queries.getMapQuery("", function(err, query){
			var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

			app.http.get(api, function(res){
			    var body = '';

			    res.on('data', function(chunk){
			        body += chunk;
			    });

			    res.on('end', function(){
			        var dt = JSON.parse(body);
			        // dt.results.title = dataset.label;
			        dt.results.attributes = dt.head.vars;
			        console.log(dt.head.vars);
			        // tempResults.push(dt.results);
			        // cb_dt();
			        callback(err, dt.results);
			    });
			}).on('error', function(e){
			    console.log("Got an error: ", e);
			    // cb_dt();
			});
		});
	};

	var getChartData = function(params, callback){
		var tempResults = [];
		app.async.each(params, function(param, cb_dt){
			models.datasets.findByIdxName(param, function(err, dataset){
				if (dataset){
					queries.getChartQuery(dataset, function(err, query){
						var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

						app.http.get(api, function(res){
						    var body = '';

						    res.on('data', function(chunk){
						        body += chunk;
						    });

						    res.on('end', function(){
						        var dt = JSON.parse(body);
						        dt.results.title = dataset.label;
						        dt.results.attributes = dt.head.vars;
						        tempResults.push(dt.results);
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
			var results = [];
			app.async.each(tempResults, function(tempResult, cb_temp){
				var result = {};
				result.name = tempResult.title;
				result.type = "bar";
				result.x = [];
				result.y = [];
				app.async.each(tempResult.bindings, function(row, cb_row){
					result.x.push(row[tempResult.attributes[1]].value);
					result.y.push(row[tempResult.attributes[2]].value);
					cb_row();
				}, function(err){
					if (err) console.log(err);
					results.push(result);
					cb_temp();
				});
			}, function(err){
				if (err) console.log(err);
				callback(err, results);
			});
		});
	};

	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		var params = req.query.dataset;
		app.async.parallel([
			function(callback){
				getCategoriesAndDatasets(function(err, categories){
					callback(err, categories);
				});
			}, function(callback){
				isDataset(params, function(err, datasets){
					getTableData(datasets, function(err, results){
						callback(err, results);
					});
				});
			}, function(callback){
				isDataset(params, function(err, datasets){
					getChartData(datasets, function(err, results){
						callback(err, results);
					});
				});
			}, function(callback){
				getMapData(function(err, results){
					callback(err, results);
				});
			}
		], function(err, results){
			if (err) console.log(error);
			res.render('visualisation.pug', { 
				active: "home", 
				categories: results[0],
				ds: results[1],
				data: JSON.stringify(results[2]),
				mapdata: results[3]
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
}