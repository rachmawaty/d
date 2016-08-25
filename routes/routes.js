var request = require('request');

module.exports = function(app, models){
	require('./misc')(app, models);

	var filter = " { select distinct ?Subject"
				+" where {?Subject ?p ?o ."
				+" FILTER regex(?o, 'manchester', 'i')"
				+" } } ";
	var selectAllGraphs = "SELECT DISTINCT ?namedgraph ?label"
							+" WHERE { GRAPH ?namedgraph { ?s ?p ?o } }"
							+" ORDER BY ?namedgraph";
	var defaultQuery = " { select distinct *"
						+" where { ?Subject ?Predicate ?Object }"
						+" } ";

	var getCategoriesAndDatasets = function(callback){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function(parent_category, cb_parent){
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxname, function(err, children_categories){
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

	var getCategoriesAndDatasets2 = function(callback){
		models.categories2.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			app.async.each(parent_categories, function(parent_category, cb_parent){
				models.categories2.findByParentId(parent_category.id.value, function(err, children_categories){
					if (err) console.log(err);
					app.async.each(children_categories, function(child_category, cb_child){
						models.datasets2.findByCategoryId(child_category.id.value, function(err, datasets){
							if (err) console.log(err);
							child_category.datasets = datasets;
							cb_child();
						});
					}, function(err){
						parent_category.children = children_categories;
						cb_parent();
					});
				});
			}, function(err){
				if (err) console.log(err);
				callback(err, parent_categories);
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

	var callSPARQLAPI = function(query, callback){
		var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";
		app.http.get(api, function(res){
		    var body = '';

		    res.on('data', function(chunk){
		        body += chunk;
		    });

		    res.on('end', function(){
		        var dt = JSON.parse(body);
		        callback(null, dt);
		    });
		}).on('error', function(e){
		    console.log("Got an error: ", e);
		    callback(e, null);
		});
	};

	var queryData = function(params, callback){
		var results = [];
		app.async.each(params, function(param, cb_dt){
			models.datasets.findByIdxName(param, function(err, dataset){
				if (dataset){
					callSPARQLAPI(dataset.query, function(err, dt){
						dt.results.dataset = dataset;
					    dt.results.headers = dt.head.vars;
					    results.push(dt.results);
						cb_dt();
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

	var getData = function(qresults, callback){
		var refArea = [];
		var mapData = [];
		var chartData = [];
		var xtitle = "";
		var ytitle = "";
		var datasets = [];
		app.async.each(qresults, function(result, cb_res){
			datasets.push(result);
			var chart = {};
			chart.name = result.dataset.title;
			chart.type = "bar";
			chart.x = [];
			chart.y = [];
			app.async.each(result.bindings, function(row, cb_row){
				var mapDataLength = mapData.length;
				app.async.parallel([
					function (callback){
						models.visualisations.findByDatasetIdAndType(result.dataset._id, "chart", function(err, vchart){
							if (vchart) {
								chart.x.push(row[vchart.chart.xheader].value);
								chart.y.push(row[vchart.chart.yheader].value);
								xtitle = vchart.chart.xtitle;
								ytitle = vchart.chart.ytitle;
								callback(null);
							} else {
								callback(null);
							}
						});
					}, function (callback) {
						models.visualisations.findByDatasetIdAndType(result.dataset._id, "map", function(err, vmap){
							if (vmap){
								if (refArea.indexOf(row[vmap.map.referencearea].value) == -1) {
									refArea.push(row[vmap.map.referencearea].value);
									var data = { refArea: row[vmap.map.referencearea].value,
												area: row[vmap.map.labelarea].value, 
												lat: row[vmap.map.latitude].value, 
												long: row[vmap.map.longitude].value,
												info: result.dataset.title + " : " + row[vmap.map.information].value};
									mapData.push(data);
									callback(null);
								} else {
									var index = refArea.indexOf(row[vmap.map.referencearea].value);
									if (mapData[index].refArea == row[vmap.map.referencearea].value) {
										var info = " <br> " + result.dataset.title + " : " + row[vmap.map.information].value;
										mapData[index].info += info;
										callback(null);
									} else {
										callback(null);
									}
								}
							} else {
								callback(null);
							}
						});
					}
				], function(err, res){
					if (err) console.log(err);
					cb_row();
				});
				
			}, function(err){
				if (err) console.log(err);
				chartData.push(chart);
				cb_res();
			});
		}, function(err){
			if (err) console.log(err);
			var results = {};
			var chartOptions = {xtitle: xtitle, ytitle: ytitle};
			results.chartData = chartData;
			results.chartOptions = chartOptions;
			results.mapData = mapData;
			results.oriData = datasets;
			callback(err, results);
		});
	}

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
						queryData(datasets, function(err, qresults){
							getData(qresults, function(err, results){
								callback(err, results);
							});
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
			var mapData = {};
			var dataTitle = "";
			var oriData = {};
			if (results[1]){
				chartOptions.title = results[2];
				chartOptions.xtitle = results[1].chartOptions.xtitle;
				chartOptions.ytitle = results[1].chartOptions.ytitle;
				data = results[1].chartData;
				mapData = results[1].mapData;
				oriData = results[1].oriData;
				dataTitle = results[2];
			} else {
				chartOptions.title = "Chart Title";
				chartOptions.xtitle = "X";
				chartOptions.ytitle = "Y";
			}
			res.render('index.pug', { 
				active: "home", 
				categories: results[0],
				ds: oriData,
				title: dataTitle,
				data: JSON.stringify(data),
				mapdata: JSON.stringify(mapData),
				chartOptions: JSON.stringify(chartOptions),
				cat: categoryparam
			});
		});
	});

	app.get('/datasets', function(req, res){
		getCategoriesAndDatasets2(function(err, categories){
			if (err) console.log(err);
			console.log(categories[0].children[0]);
			res.render('listdata.pug', { 
				active:"datasets", 
				categories: categories 
			});
		});
	});

	app.get('/d/:idxname', function(req, res){
		var idxname = req.params.idxname;
		models.datasets2.findByIdxName(idxname, function(err, dataset){
			if (err) console.log(err);
			models.categories2.findById(dataset[0].categoryid.value, function(err, category){
				if (err) console.log(err);
				models.categories2.findByIdxName(category[0].parentidxname.value, function(err, parentCategory){
					if (err) console.log(err);
					var breadcrumb = parentCategory[0].label.value + " > " + category[0].label.value + " > " + dataset[0].title.value;
					res.render('metadata.pug', { dataset: dataset, breadcrumb: breadcrumb, active:"datasets" });
				});
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