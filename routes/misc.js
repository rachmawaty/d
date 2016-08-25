module.exports = function (app, models){
	var queryData = function(params, callback){
		var results = [];
		app.async.each(params, function(param, cb_dt){
			models.datasets.findByIdxName(param, function(err, dataset){
				if (dataset){
					var query = dataset.query;
					var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

					app.http.get(api, function(res){
					    var body = '';

					    res.on('data', function(chunk){
					        body += chunk;
					    });

					    res.on('end', function(){
					        var dt = JSON.parse(body);
					        dt.results.dataset = dataset;
					        dt.results.headers = dt.head.vars;
					        results.push(dt.results);
					        cb_dt();
					    });
					}).on('error', function(e){
					    console.log("Got an error: ", e);
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
		var results = {};
		app.async.each(qresults, function(result, cb_res){
			var chart = {};
			chart.name = result.dataset.title;
			chart.type = "bar";
			chart.x = [];
			chart.y = [];
			app.async.each(result.bindings, function(row, cb_row){
				var mapDataLength = mapData.length;
				// console.log(mapDataLength);
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
			var chartOptions = {xtitle: xtitle, ytitle: ytitle};
			results.chartData = chartData;
			results.chartOptions = chartOptions;
			results.mapData = mapData;
			results.rows = 
			console.log(mapData[0]);
			callback(err, results);
		});
	}
	// queryData(["imd-rank-health", "imd-rank-housing"], function(err, qresults){
	// 	getData(qresults, function(err, results){
	// 		console.log(results.chartOptions);
	// 	});
	// });

	var testLoadTime = function(){
		var start, stop;
		models.datasets2.findAll(function(err, datasets){
			app.async.eachSeries(datasets, function(dataset, cb){
				start = app.moment();
				
				var query = dataset.query.value;
				var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

				app.http.get(api, function(res){
				    var body = '';

				    res.on('data', function(chunk){
				        body += chunk;
				    });

				    res.on('end', function(){
				        var dt = JSON.parse(body);
				        stop = app.moment();
						var diff = stop - start;
						// console.log(dt.head.vars);
						console.log("--- DATA SET ", dataset.title, dataset.categoryid, " --- LOAD TIME ", diff);
				        cb();
				    });
				}).on('error', function(e){
				    console.log("Got an error: ", e);
				    cb();
				});
			}, function(err){
				if (err) console.log(err);
			});
		});
	}

	// testLoadTime();

	var testCategory = function(){
		// models.categories2.findAll(function(err, categories){
		// 	console.log(categories);
		// });
		// models.categories2.findById("http://localhost:2525/categories/imd", function(err, category){
		// 	console.log(category);
		// });
		// models.categories2.findByLevel(0, function(err, categories){
		// 	console.log(categories);
		// });
		// models.categories2.findByIdxName("imd", function(err, category){
		// 	console.log(category);
		// });
		// models.categories2.findByParentId("http://localhost:2525/categories/imd", function(err, categories){
		// 	console.log(categories);
		// });
		// models.categories2.findByParentIdxName("imd", function(err, categories){
		// 	console.log(categories);
		// });
		
	}
	// testCategory();

	var getCategoriesAndDatasets2 = function(callback){
		models.categories2.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
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
			});
		});
	};
	// getCategoriesAndDatasets2();
}