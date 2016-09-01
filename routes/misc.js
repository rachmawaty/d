module.exports = function (app, models){
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

	var testVisualisation = function(){
		models.visualisations2.findByDatasetIdAndType("http://localhost:2525/datasets/imd-rank-crime", "map", function(err, vis){
			console.log(vis);
		});
	}
	// testVisualisation();

	var callAPI = function(query, callback){
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

	var queryData2 = function(params, callback){
		var results = [];
		app.async.each(params, function(param, cb_dt){
			models.datasets2.findByIdxName(param, function(err, dataset){
				if (dataset.length > 0){
					callAPI(dataset[0].query.value, function(err, dt){
						dt.results.dataset = dataset[0];
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

	var getCombinedTable = function(qresults, callback){
		queryData2(['imd-rank-crime', 'imd-rank-education'], function(err, res){
			var combinedQuery = "SELECT distinct * ";
			var namedgraph = "";
			var whereOpenBracket = " where { ";
			var optOpenBracket = " OPTIONAL { ";
			var optional = "";
			var optCloseBracket = " } ";
			var filter = "";
			var whereCloseBracket = "}";
			app.async.each(res, function(r, cb){
				// console.log(r.dataset);
				var addnamedgraph = " from <" + r.dataset.namedgraph.value + ">";
				
				var optquery = " " + r.dataset.optionalquery.value;
				if (namedgraph == ""){
					namedgraph = addnamedgraph;
					filter = r.dataset.filterquery.value;
					whereOpenBracket += optquery;
					cb();
				} else {
					namedgraph += addnamedgraph;
					optional += optquery;
					cb();
				}
			}, function(err){
				combinedQuery = combinedQuery + namedgraph + whereOpenBracket + 
								optOpenBracket + optional + optCloseBracket + 
								filter + whereCloseBracket;
				// console.log(combinedQuery);
				callAPI(combinedQuery, function(err, ct){
					// console.log(ct);
				});
			});
			// console.log(res.headers);
		});
	}
	// getCombinedTable();
}