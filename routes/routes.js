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

	var getTableData = function(callback){
		var results = [];
		models.datasets.findAll(function(err, datasets){
			app.async.each(datasets, function(dataset, cb_dt){
				// var namedGraph = "<http://localhost:8890/imd/rank/health>";
				// var query = "select distinct * where {graph "+ namedGraph +" {?s ?p ?o . FILTER regex(?o, 'manchester', 'i')} } order by ?s LIMIT 10";

				// var query = "select distinct ?s ?type ?label ?dataset ?refarea ?refperiod ?rank "
				// 			+ " where { graph " + namedGraph
				// 			+ " { ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type."
				// 			+ " ?s <http://www.w3.org/2000/01/rdf-schema#label> ?label."
				// 			+ " ?s <http://purl.org/linked-data/cube#dataSet> ?dataset."
				// 			+ " ?s <http://opendatacommunities.org/def/ontology/geography/refArea> ?refarea."
				// 			+ " ?s <http://opendatacommunities.org/def/ontology/time/refPeriod> ?refperiod."
				// 			+ " ?s <http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdHealthRank> ?rank."
				// 			+ " } } order by ?s limit 10";
				queries.getTableQuery(dataset, function(err, query){
					console.log(dataset.namedGraph);
					var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

					app.http.get(api, function(res){
					    var body = '';

					    res.on('data', function(chunk){
					        body += chunk;
					    });

					    res.on('end', function(){
					        var dt = JSON.parse(body);
					        dt.results.title = dataset.label;
					        // console.log(namedGraph, dt.results)
					        results.push(dt.results);
					        cb_dt();
					    });
					}).on('error', function(e){
					    console.log("Got an error: ", e);
					    cb_dt();
					});
				});
				
			}, function(err){
				if (err) console.log(err);
				// console.log("Last response: ", results.length, results[0].bindings[0]);
				callback(err, results);
			});
		});
	};

	var getMapData = function(){

	};

	var getChartData = function(){

	};

	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		app.async.parallel([
			function(callback){
				getCategoriesAndDatasets(function(err, categories){
					callback(err, categories);
				});
			}, function(callback){
				getTableData(function(err, results){
					callback(err, results);
				});
			}
		], function(err, results){
			if (err) console.log(error);
			res.render('visualisation.pug', { 
				active: "home", 
				categories: results[0],
				ds: results[1] 
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
		res.render('index.pug', { active:"about" });
	});

	app.get('/filter', function(req, res){
		res.send("200");
	});
}