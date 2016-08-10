module.exports = function (app, models){
	var addCategories = function(){
		var insertedCategories = [
		{label: 'Deprivation', level: 0, idxName: 'imd', parentIdxName: ''}, 
		{label: 'Public Transport', level: 0, idxName: 'tfgm', parentIdxName: ''}, 
		{label: 'Location', level: 0, idxName: 'location', parentIdxName: ''}, 
		{label: 'Rank', level: 1, idxName: 'rank', parentIdxName: 'imd'},
		{label: 'Score', level: 1, idxName: 'score', parentIdxName: 'imd'},
		{label: 'Bus', level: 1, idxName: 'bus', parentIdxName: 'tfgm'},
		{label: 'Tram', level: 1, idxName: 'tram', parentIdxName: 'tfgm'},
		{label: 'Train', level: 1, idxName: 'train', parentIdxName: 'tfgm'}];

		for(var i=0;i<insertedCategories.length;i++){
			var label = insertedCategories[i].label;
			var level = insertedCategories[i].level;
			var idxName = insertedCategories[i].idxName;
			var parentIdxName = insertedCategories[i].parentIdxName;
			// console.log(insertedCategories[i]);
			models.categories.newCategory(label, level, idxName, parentIdxName, function(err, cat){
				console.log(cat);
			});
		}
	}
	// addCategories();

	var getParentAndChildren = function(){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function (parent_category, cb_parent) {
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxname, function(err, children_categories){
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
				console.log(categories[0].children[0]);
			});
		});
	}
	// getParentAndChildren();

	var addDatasets = function(){
		var insertedDatasets = [
		{label: 'Education', idxName: 'imd-score-education', sourceLink: '', namedGraph:'http://localhost:8890/imd/score/education', categoryId: '5789373a1822f78f17a12bea'}, 
		{label: 'Environment', idxName: 'imd-score-environment', sourceLink: '', namedGraph:'http://localhost:8890/imd/score/environment', categoryId: '5789373a1822f78f17a12bea'},
		{label: 'Health', idxName: 'imd-score-health', sourceLink: '', namedGraph:'http://localhost:8890/imd/score/health', categoryId: '5789373a1822f78f17a12bea'},
		{label: 'Education', idxName: 'imd-rank-education', sourceLink: '', namedGraph:'http://localhost:8890/imd/rank/education', categoryId: '5789373a1822f78f17a12be9'}, 
		{label: 'Environment', idxName: 'imd-rank-environment', sourceLink: '', namedGraph:'http://localhost:8890/imd/rank/environment', categoryId: '5789373a1822f78f17a12be9'},
		{label: 'Health', idxName: 'imd-rank-health', sourceLink: '', namedGraph:'http://localhost:8890/imd/rank/health', categoryId: '5789373a1822f78f17a12be9'}];

		for(var i=0;i<insertedDatasets.length;i++){
			var label = insertedDatasets[i].label;
			var idxName = insertedDatasets[i].idxName;
			var sourceLink = insertedDatasets[i].sourceLink;
			var namedGraph = insertedDatasets[i].namedGraph;
			var categoryId = insertedDatasets[i].categoryId;
			// console.log(insertedCategories[i]);
			models.datasets.newDataset(label, idxName, sourceLink, namedGraph, categoryId, function(err, dset){
				console.log(dset);
			});
		}
	}
	// addDatasets();

	var getCategoriesAndDatasets = function(){
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
				for (var i=0;i<categories.length;i++){
					if (categories[i].children.length>0){
						for(var j=0;j<categories[i].children.length;j++){
							console.log(categories[i].label, categories[i].children[j].label);
							if (categories[i].children[j].datasets.length>0) {
								for (var k = 0; k<categories[i].children[j].datasets.length;k++){
									console.log(categories[i].children[j].datasets[k].label);
								}
							}
						}
					}
				}
			});
		});
	}
	// getCategoriesAndDatasets();

	var checkJSON = function(){
		var datasets = ["imd/score/health", "imd/score/education", "imd/score/environment"];
		var results = [];
		// for (var i = 0; i<datasets.length; i++){
		app.async.each(datasets, function(dataset, cb_dt){
			var namedGraph = "<http://localhost:8890/"+dataset+">";
			// console.log(namedGraph);
			var query = "select distinct * where {graph "+ namedGraph +" {?s ?p ?o}} order by ?s LIMIT 10";
			var api = "http://localhost:8890/sparql?query=" + query + "&format=json";
			app.http.get(api, function(res){
			    var body = '';

			    res.on('data', function(chunk){
			        body += chunk;
			    });

			    res.on('end', function(){
			        var dt = JSON.parse(body);
			        // console.log("Got a response: ", dt.results.bindings[0].s);
			        results.push(dt.results);
			        cb_dt();
			    });
			}).on('error', function(e){
			    console.log("Got an error: ", e);
			    cb_dt();
			});
		}, function(err){
			if (err) console.log(err);
			console.log("Last response: ", results.length, results[0].bindings[0]);
			return results;
		});
			
		// }
	}
	// checkJSON();

	var getPredicates = function(callback){
		var results = [];
		models.datasets.findAll(function(err, datasets){
			app.async.each(datasets, function(dataset, cb){
				var query = "select distinct ?p where {graph <"+ dataset.namedGraph +"> {?s ?p ?o}} order by ?s LIMIT 10";
				var api = "http://localhost:8890/sparql?query=" + query + "&format=json";
				app.http.get(api, function(res){
				    var body = '';

				    res.on('data', function(chunk){
				        body += chunk;
				    });

				    res.on('end', function(){
				        var dt = JSON.parse(body);
				        var result = [];
				        result.dataset = dataset.toObject();
				        result.content = dt.results;
				        results.push(result);
				        cb();
				    });
				}).on('error', function(e){
				    console.log("Got an error: ", e);
				    cb();
				});
			}, function(err){
				if (err) console.log(err);
				// console.log("Got a response: ", results.length);
				var predicates = [];
				app.async.each(results, function(result, cb_result){
					// console.log(result.dataset.label);
					app.async.each(result.content.bindings, function(binding, cb_binding){
						var p = binding.p.value;
						// console.log(p);
						if (predicates.indexOf(p) == -1){
							predicates.push(p);
							cb_binding();
						} else {
							cb_binding();
						}
					}, function(err){
						if (err) console.log(err);
						cb_result();
					});
				}, function(err){
					if (err) console.log(err);
					// console.log(predicates.length);
					callback(err, predicates);
				});
			});
		});
	}
	// getPredicates(function(err, predicates){
	// 	console.log(predicates);
	// });

	var getPredicatesByDatasetId = function(datasetId, callback){
		var predicates = [];
		models.datasets.findById(datasetId, function(err, dataset){
			var query = "select distinct ?p where {graph <"+ dataset.namedGraph +"> {?s ?p ?o}} order by ?s LIMIT 10";
			var api = "http://localhost:8890/sparql?query=" + query + "&format=json";
			app.http.get(api, function(res){
			    var body = '';

			    res.on('data', function(chunk){
			        body += chunk;
			    });

			    res.on('end', function(){
			        var dt = JSON.parse(body);
			        app.async.each(dt.results.bindings, function(binding, cb_binding){
						var p = binding.p.value;
						// console.log(p);
						if (predicates.indexOf(p) == -1){
							predicates.push(p);
							cb_binding();
						} else {
							cb_binding();
						}
					}, function(err){
						if (err) console.log(err);
						callback(err, predicates);
					});
			    });
			}).on('error', function(e){
			    console.log("Got an error: ", e);
			});
		});
	}

	var savePredicates = function(){
		getPredicates(function(err, predicates){
			console.log(predicates.length, predicates);
			app.async.each(predicates, function(predicate, cb){
				models.predicates.newPredicate("att", predicate, "prefix", "namespace", function(err, predicate){
					console.log(predicate);
					cb();
				});
			}, function(err){
				if (err) console.log(err);
			});
		});
	}
	// savePredicates();

	var tryToStorePredicates = function(){
		var predicates = [ {label: 'Type', uri:'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', prefix:"rdf", namespace:'http://www.w3.org/1999/02/22-rdf-syntax-ns#'},
						  {label: 'Label', uri:'http://www.w3.org/2000/01/rdf-schema#label', prefix:"rdfs", namespace:'http://www.w3.org/2000/01/rdf-schema#'},
						  {label: 'Dataset', uri:'http://purl.org/linked-data/cube#dataSet', prefix:"rdfs", namespace:''},
						  {label: 'RefArea', uri:'http://opendatacommunities.org/def/ontology/geography/refArea', prefix:"rdfs", namespace:''},
						  {label: 'RefPeriod', uri:'http://opendatacommunities.org/def/ontology/time/refPeriod', prefix:"rdfs", namespace:''},
						  {label: 'EnvironmentRank', uri:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdEnvironmentRank', prefix:"odcimd", namespace:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/'},
						  {label: 'HealthRank', uri:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdHealthRank', prefix:"odcimd", namespace:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/'},
						  {label: 'HealthScore', uri:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdHealthScore', prefix:"odcimd", namespace:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/'},
						  {label: 'EducationScore', uri:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdEducationScore', prefix:"odcimd", namespace:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/'},
						  {label: 'EducationRank', uri:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdEducationRank', prefix:"odcimd", namespace:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/'},
						  {label: 'EnvironmentScore', uri:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdEnvironmentScore', prefix:"odcimd", namespace:'http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/'}
						 ];
	 	app.async.each(predicates, function(predicate, cb){
			models.predicates.newPredicate(predicate.label, predicate.uri, predicate.prefix, predicate.namespace, function(err, predicate){
				console.log(predicate);
				cb();
			});
		}, function(err){
			if (err) console.log(err);
		});
	}
	// tryToStorePredicates();

	var lala = function(){
		models.predicates.findAll(function(err, predicates){
			app.async.each(predicates, function(predicate, cb_p){
				console.log(predicate._id, predicate.uri);
				cb_p();
			}, function(err){
				if (err) console.log(err);
			});
		});
	}
	// lala();

	var getDatasetsAndPredicates = function(callback){
		var results = [];
		models.datasets.findAll(function(err, datasets){
			app.async.each(datasets, function(dataset, cb){
				var query = "select distinct ?p where {graph <"+ dataset.namedGraph +"> {?s ?p ?o}} order by ?s LIMIT 10";
				var api = "http://localhost:8890/sparql?query=" + query + "&format=json";
				app.http.get(api, function(res){
				    var body = '';

				    res.on('data', function(chunk){
				        body += chunk;
				    });

				    res.on('end', function(){
				        var dt = JSON.parse(body);
				        var result = [];
				        var predicates = [];
				        app.async.each(dt.results.bindings, function(binding, cb_binding){
							var p = binding.p.value;
							if (predicates.indexOf(p) == -1){
								predicates.push(p);
								cb_binding();
							} else {
								cb_binding();
							}
						}, function(err){
							if (err) console.log(err);
							result.dataset = dataset.toObject();
					        result.predicates = predicates;
					        results.push(result);
							cb();
						});
				    });
				}).on('error', function(e){
				    console.log("Got an error: ", e);
				    cb();
				});
			}, function(err){
				if (err) console.log(err);
				callback(err, results);
			});
		});
	}

	var savePredicatesToDataset = function(){
		getDatasetsAndPredicates(function(err, results){
			app.async.each(results, function(result, cb){
				models.datasets.updatePredicates(result.dataset._id, result.predicates, function(err){
					if (err) console.log(err);
					cb();
				});
			}, function(err){
				if (err) console.log(err);
			});
		});
	}
	// savePredicatesToDataset();

	var addChartAttributesV2 = function(){
		var list = [ {name:'imd-rank-environment',
						  chart:{x:'Area',
						   y:'Rank'}
						},
						{name:'imd-rank-health',
						  chart:{x:'Area',
						   y:'Rank'}
						},
						{name:'imd-rank-education',
						  chart:{x:'Area',
						   y:'Rank'}
						},
						{name:'imd-score-environment',
						  chart:{x:'Area',
						   y:'Score'}
						},
						{name:'imd-score-health',
						  chart:{x:'Area',
						   y:'Score'}
						},
						{name:'imd-score-education',
						  chart:{x:'Area',
						   y:'Score'}
						}];
	 	app.async.each(list, function(ds, cb){
			models.datasets.findByIdxName(ds.name, function(err, dataset){
				if (dataset) {
					models.datasets.updateChartAttributes(dataset._id, ds.chart, function(err){
						if (err) console.log(err);
						cb();
					});
				} else {
					cb();
				}
			});
		}, function(err){
			if (err) console.log(err);
		});
	}
	// addChartAttributesV2();

	var queries = require('./query')(app, models);
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
						        console.log(dt.head.vars);
						        dt.results.chartAttributes = dataset.chartAttributes;
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
					app.async.parallel([
						function(callback){
							models.predicates.getLabelByUri(tempResult.chartAttributes.x, function(err, xlabel){
								callback(err, row[xlabel].value);
							});
						}, function(callback){
							models.predicates.getLabelByUri(tempResult.chartAttributes.y, function(err, ylabel){
								callback(err, row[ylabel].value);
							});
						}
					], function(err, res){
						if (err) console.log(err);
						result.x.push(res[0]);
						result.y.push(res[1]);
						cb_row();
					});
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

	var cheers = function(params){
		isDataset(params, function(err, datasets){
			getChartData(datasets, function(err, results){
				if (err) console.log(err);
				console.log(results);
			});
		});
	}
	// cheers('imd-score-health');

	var updateLocation = function(){
		var list = [ {name:'imd-rank-environment', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-rank-education', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-rank-health', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-rank-crime', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-rank-employment', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-rank-housing', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-rank-income', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Rank'},
					{name:'imd-score-environment', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'},
					{name:'imd-score-education', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'},
					{name:'imd-score-health', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'},
					{name:'imd-score-crime', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'},
					{name:'imd-score-employment', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'},
					{name:'imd-score-housing', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'},
					{name:'imd-score-income', refArea: 'RefArea', area: 'Area', long: 'Longitude', lat: 'Latitude', information: 'Score'}
					];
	 	app.async.each(list, function(ds, cb){
			models.datasets.findByIdxName(ds.name, function(err, dataset){
				if (dataset) {
					models.datasets.updateLocation(dataset._id, true, ds.refArea, ds.area, ds.long, ds.lat, ds.information, function(err){
						if (err) console.log(err);
						cb();
					});
				} else {
					cb();
				}
			});
		}, function(err){
			if (err) console.log(err);
		});
	}
	// updateLocation();

	var updateQuery = function(){
		var queryString = " select distinct ?Subject ?Type ?Label ?Dataset ?RefPeriod ?RefArea ?Area ?Score ?Longitude ?Latitude"
						+ " from <http://localhost:8890/imd/score/employment>"
						+ " from <http://localhost:8890/location/lsoa>"
						+ " where {"
						+ " ?Subject <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?Type."
						+ " ?Subject <http://www.w3.org/2000/01/rdf-schema#label> ?Label."
						+ " ?Subject <http://purl.org/linked-data/cube#dataSet> ?Dataset."
						+ " ?Subject <http://opendatacommunities.org/def/ontology/time/refPeriod> ?RefPeriod."
						+ " ?Subject <http://opendatacommunities.org/def/ontology/geography/refArea> ?RefArea."
						+ " ?Subject <http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdEmploymentScore> ?Score."
						+ " ?RefArea <http://www.w3.org/2000/01/rdf-schema#label> ?Area."
						+ " ?RefArea <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?Longitude."
						+ " ?RefArea <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?Latitude."
						+ " {"
						+ " select distinct ?Subject"
						+ " where { ?Subject ?p ?o"
						+ " FILTER regex(?o, 'manchester', 'i')"
						+ " }"
						+ " 	}" 
						+ " } order by ?Subject";
		models.datasets.findByIdxName('imd-score-environment', function(err, dataset){
			models.datasets.updateQuery(dataset._id, queryString, function(err){
				if (err) console.log(err);
			});
		});
	}
	// updateQuery();

	var getQueries = function(){
		models.datasets.findAll(function(err, datasets){
			app.async.each(datasets, function(dataset, cb){
				console.log(dataset.idxName);
				console.log(dataset.query);
				cb();
			}, function(err){
				if (err) console.log(err);
			});
		});
	}
	// getQueries();

	var addNewDatasets = function(){
		var insertedDatasets = [
		{label: 'Income', idxName: 'imd-rank-income', sourceLink: 'http://opendatacommunities.org/data/societal-wellbeing/deprivation/imd-income-rank-2010', namedGraph:'http://localhost:8890/imd/rank/income', categoryId: '5789373a1822f78f17a12be9'}, 
		{label: 'Income', idxName: 'imd-score-income', sourceLink: 'http://opendatacommunities.org/data/societal-wellbeing/deprivation/imd-income-score-2010', namedGraph:'http://localhost:8890/imd/score/income', categoryId: '5789373a1822f78f17a12bea'}];

		for(var i=0;i<insertedDatasets.length;i++){
			var label = insertedDatasets[i].label;
			var idxName = insertedDatasets[i].idxName;
			var sourceLink = insertedDatasets[i].sourceLink;
			var namedGraph = insertedDatasets[i].namedGraph;
			var categoryId = insertedDatasets[i].categoryId;
			// console.log(insertedCategories[i]);
			models.datasets.newDataset(label, idxName, sourceLink, namedGraph, categoryId, function(err, dset){
				console.log(dset);
			});
		}
	}
	// addNewDatasets();

	var updateNamedGraphs = function(){
		var insertedDatasets = [
		{idxName: 'imd-rank-crime', namedGraph:'http://localhost:8890/imd/rank/crime'}, 
		{idxName: 'imd-rank-employment', namedGraph:'http://localhost:8890/imd/rank/employment'},
		{idxName: 'imd-rank-housing', namedGraph:'http://localhost:8890/imd/rank/housing'}];

		for(var i=0;i<insertedDatasets.length;i++){
			var idxName = insertedDatasets[i].idxName;
			var namedGraph = insertedDatasets[i].namedGraph;
			// console.log(insertedCategories[i]);
			models.datasets.updateNamedGraphByIdxName(idxName, namedGraph, function(err, dset){
				console.log(dset);
			});
		}
	}
	// updateNamedGraphs();

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
			var start = app.moment();
			var refArea = [];
			var mapData = [];
			app.async.each(results, function(result, cb_temp){
				console.log(result.title);
				app.async.each(result.rows, function(row, cb_row){
					var mapDataLength = mapData.length;
					console.log(row["Area"].value);
					if (refArea.indexOf(row[result.mapAttributes.refArea].value) == -1) {
						refArea.push(row[result.mapAttributes.refArea].value);
						var data = { refArea: row[result.mapAttributes.refArea].value,
									area: row["Area"].value,
									lat: row[result.mapAttributes.lat].value, 
									long: row[result.mapAttributes.long].value,
									info: result.title + " : " + row[result.mapAttributes.information].value};
						mapData.push(data);
						cb_row();
					} else {
						for(var i = 0; i < mapDataLength; i++){
							if (mapData[i].refArea == row[result.mapAttributes.refArea].value) {
								var info = "-" + result.title + " : " + row[result.mapAttributes.information].value;
								mapData[i].info += info;
								cb_row();
							}
						}
					}
					// console.log(row["RefArea"].value, row[result.mapAttributes.lat].value, row[result.mapAttributes.long].value, row[result.mapAttributes.information].value);					
				}, function(err){
					if (err) console.log(err);
					cb_temp();
				});
			}, function(err){
				if (err) console.log(err);
				var finish = app.moment();
				var diff = finish - start;
				console.log(diff);
				console.log(mapData.length, mapData[0].info);
			});
		});
	};
	// getData(['imd-rank-health', 'imd-score-environment'], function(err, results){
	// 	console.log(results.xtitle);
	// });

	var updateYear = function(){
		models.datasets.findAll(function(err, datasets){
			app.async.each(datasets, function(dataset, cb){
				models.datasets.updateYear(dataset._id, "2010", function(err, dataset){
					cb();
				});
			}, function(err){

			});
		});
	}

	// updateYear();
}