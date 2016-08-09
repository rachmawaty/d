var request = require('request');

module.exports = function(app, models){
	require('./misc')(app, models);
	require('./data')(app, models);
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
						        dt.results.dataset = dataset;
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
			app.async.parallel([
				function(callback){
					var chartData = [];
					var xtitle = results[0].chartAttributes.x;
					var ytitle = results[0].chartAttributes.y;
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
						var res = {};
						res.xtitle = xtitle;
						res.ytitle = ytitle;
						res.data = chartData;
						callback(err, res);
					});
				}, function(callback){
					var mapData = [];
					// app.async.each(results, function(result, cb_temp){
					// 	var chart = {};
					// 	chart.name = result.title;
					// 	chart.type = "bar";
					// 	chart.x = [];
					// 	chart.y = [];
					// 	app.async.each(result.bindings, function(row, cb_row){
					// 		chart.x.push(row[result.chartAttributes.x].value);
					// 		chart.y.push(row[result.chartAttributes.y].value);
					// 		cb_row();
					// 	}, function(err){
					// 		if (err) console.log(err);
					// 		chartData.push(chart);
					// 		cb_temp();
					// 	});
					// }, function(err){
					// 	if (err) console.log(err);
						callback(null, "");
					// });
				}
			], function(err, res){
				if (err) console.log(err);
				var chartOptions = {xtitle: res[0].xtitle, ytitle: res[0].ytitle};
				results.chartData = res[0].data;
				results.chartOptions = chartOptions;
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
					if (datasets != null && datasets != '#') {
						getData(datasets, function(err, results){
							callback(err, results);
						});
					} else {
						callback(err, null);
					}
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
					var chartTitle = title;
					callback(err, chartTitle);
				});
			}
		], function(err, results){
			if (err) console.log(error);
			var chartOptions = {};
			var data = {};
			if (results[1]){
				chartOptions.title = results[2];
				chartOptions.xtitle = results[1].chartOptions.xtitle;
				chartOptions.ytitle = results[1].chartOptions.ytitle;
				data = results[1].chartData;
			} else {
				chartOptions.title = "Chart Title";
				chartOptions.xtitle = "X";
				chartOptions.ytitle = "Y";
			}
			res.render('index.pug', { 
				active: "home", 
				categories: results[0],
				ds: results[1],
				data: JSON.stringify(data),
				mapdata: JSON.stringify(results[1]),
				chartOptions: JSON.stringify(chartOptions),
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