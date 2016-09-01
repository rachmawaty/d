var request = require('request');

module.exports = function(app, models){
	require('./misc')(app, models);
	
	var selectAllGraphs = "SELECT DISTINCT ?namedgraph ?label"
						+" WHERE { GRAPH ?namedgraph { ?s ?p ?o } }"
						+" ORDER BY ?namedgraph";

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

	var callAPI = function(query, callback){
		var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";
		// var st = app.moment();
		app.http.get(api, function(res){
		    var body = '';

		    res.on('data', function(chunk){
		        body += chunk;
		    });

		    res.on('end', function(){
		    	// var fn = app.moment();
		    	// console.log("BEFORE PARSE:", fn-st);
		        var dt = JSON.parse(body);
		        callback(null, dt);
		    });
		}).on('error', function(e){
		    console.log("Got an error: ", e);
		    callback(e, null);
		});
	};

	var setDatasetParams = function(param, callback){
		models.datasets2.findByIdxName(param, function(err, dataset){
			if (dataset.length > 0) {
				var params = [];
				params.push(param);
				callback(err, params);
			} else {
				callback(err, param);
			}
		});
	}

	var queryData2 = function(params, callback){
		var results = [];
		var start = app.moment();
		app.async.eachSeries(params, function(param, cb_dt){
			models.datasets2.findByIdxName(param, function(err, dataset){
				if (dataset.length > 0){
					var startparam = app.moment();
					callAPI(dataset[0].query.value, function(err, dt){
						var endparam = app.moment();
						dt.results.dataset = dataset[0];
					    dt.results.headers = dt.head.vars;
					    results.push(dt.results);
					    console.log(param, ": ", endparam-startparam);
						cb_dt();
					});
				} else {
					cb_dt();
				}
			});
		}, function(err){
			if (err) console.log(err);
			var finish = app.moment();
			if (params) console.log('diff ', params.length, " : ", finish - start);
			callback(err, results);
		});
	};

	var getData2 = function(qresults, callback){
		console.log("QUERY RESULTS RETRIEVED");
		var refArea = [];
		var mapData = [];
		var chartData = [];
		var xtitle = "";
		var ytitle = "";
		var datasets = [];
		//SET COMBINED TABLE
		var combinedQuery = "SELECT distinct * ";
		var namedgraph = "";
		var whereOpenBracket = " where { ";
		var optOpenBracket = " OPTIONAL { ";
		var optional = "";
		var optCloseBracket = " } ";
		var filter = "";
		var whereCloseBracket = "}";
		app.async.each(qresults, function(result, cb_res){
			datasets.push(result);
			var chart = {};
			chart.name = result.dataset.title.value;
			chart.type = "bar";
			chart.x = [];
			chart.y = [];
			app.async.parallel([
				function (callback){
					models.visualisations2.findByDatasetIdAndType(result.dataset.id.value, "chart", function(err, vchart){
						if (err) console.log(err);
						callback(err, vchart[0]);
					});
				}, function (callback){
					models.visualisations2.findByDatasetIdAndType(result.dataset.id.value, "map", function(err, vmap){
						if (err) console.log(err);
						callback(err, vmap[0]);
					});
				}
			], function(err, res_vis){
				var vchart = res_vis[0];
				var vmap = res_vis[1];
				app.async.each(result.bindings, function(row, cb_row){
					app.async.parallel([
						function (callback){
							if (vchart) {
								chart.x.push(row[vchart.xheader.value].value);
								chart.y.push(row[vchart.yheader.value].value);
								xtitle = vchart.xtitle.value;
								ytitle = vchart.ytitle.value;
								callback(null);
							} else {
								callback(null);
							}
						}, function (callback) {
							if (vmap) {
								if (refArea.indexOf(row[vmap.referencearea.value].value) == -1) {
									refArea.push(row[vmap.referencearea.value].value);
									var data = { refArea: row[vmap.referencearea.value].value,
												area: row[vmap.labelarea.value].value, 
												lat: row[vmap.latitude.value].value, 
												long: row[vmap.longitude.value].value,
												info: result.dataset.title.value + " : " + row[vmap.information.value].value};
									mapData.push(data);
									callback(null);
								} else {
									var index = refArea.indexOf(row[vmap.referencearea.value].value);
									if (mapData[index].refArea == row[vmap.referencearea.value].value) {
										var info = " <br> " + result.dataset.title.value + " : " + row[vmap.information.value].value;
										mapData[index].info += info;
										callback(null);
									} else {
										callback(null);
									}
								}
							} else {
								callback(null);	
							}
						}
					], function(err, res){
						if (err) console.log(err);
						cb_row();
					});
				}, function(err){
					if (err) console.log(err);
					chartData.push(chart);
					var addnamedgraph = " from <" + result.dataset.namedgraph.value + ">";
					var optquery = " " + result.dataset.optionalquery.value;
					if (namedgraph == ""){
						namedgraph = addnamedgraph;
						filter = result.dataset.filterquery.value;
						whereOpenBracket += optquery;
						cb_res();
					} else {
						namedgraph += addnamedgraph;
						optional += optquery;
						cb_res();
					}
				});
			});
		}, function(err){
			if (err) console.log(err);
			var results = {};
			var chartOptions = {xtitle: xtitle, ytitle: ytitle};
			results.chartData = chartData;
			results.chartOptions = chartOptions;
			results.mapData = mapData;
			results.oriData = datasets;
			if (qresults.length > 1){
				combinedQuery = combinedQuery + namedgraph + whereOpenBracket + 
								optOpenBracket + optional + optCloseBracket + 
								filter + whereCloseBracket;
				// console.log(combinedQuery);
				var startcombine = app.moment();
				callAPI(combinedQuery, function(err, ct){
					if (err) console.log(err);
					var finishcombine = app.moment();
					console.log("combine ", finishcombine-startcombine);
					// var combinedTable = {};
					ct.results.headers = ct.head.vars;
					console.log(ct.results.headers);
					// combinedTable.items = ct.results.bindings;
					ct.results.dataset = false;
					// results.combinedTable = combinedTable;
					// console.log(ct.results.bindings);
					// console.log(results.oriData.length);
					results.oriData.push(ct.results);
					// console.log(results.oriData.length);
					callback(err, results);
				});
			} else {
				callback(err, results);
			}
		});
	};

	app.get('/home', function(req, res){
		var params = req.query.dataset;
		var categoryparam = req.query.category;
		console.log(categoryparam);
		app.async.parallel([
			function(callback){
				getCategoriesAndDatasets2(function(err, categories){
					callback(err, categories);
				});
			}, function(callback){
				setDatasetParams(params, function(err, datasets){
					queryData2(datasets, function(err, qresults){
						getData2(qresults, function(err, results){
							callback(err, results);
						});
					});
				});
			}, function(callback){
				if (categoryparam) {
					models.categories2.findByIdxName(categoryparam, function(err, category){
						if (err) console.log(err);
						callback(err, category[0].label.value);
					});
				} else {
					callback(null, null);
				}
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
			res.render('index2.pug', { 
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

	app.get('/', function(req, res){
		res.redirect('/home');
	});

	app.get('/datasets', function(req, res){
		getCategoriesAndDatasets2(function(err, categories){
			if (err) console.log(err);
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
					res.render('metadata.pug', { 
						dataset: dataset, 
						breadcrumb: breadcrumb, 
						category: category, 
						idxname: idxname, 
						active:"datasets" 
					});
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