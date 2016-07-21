var request = require('request');

module.exports = function(app, models){
	app.get('/home', function(req, res){
		res.redirect('/');
	});

	app.get('/', function(req, res){
		app.async.parallel([
			function(callback){
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
						// if (err) console.log(error);
						callback(err, categories);
					});
				});
			}, function(callback){
				var datasets = ["imd/score/health", "imd/score/education", "imd/score/environment"];
				var results = [];
				app.async.each(datasets, function(dataset, cb_dt){
					var namedGraph = "<http://localhost:8890/"+dataset+">";
					// var namedGraph = "http://localhost:8890/"+dataset;
					// console.log(namedGraph);
					var query = "select distinct * where {graph "+ namedGraph +" {?s ?p ?o . FILTER regex(?o, 'manchester', 'i')} } order by ?s LIMIT 10";
					// var query = "prefix id: <http://opendatacommunities.org/data/societal-wellbeing/deprivation/imd-health-rank-2010/>"
					// 			+"prefix rdfns: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"
					// 			+"prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
					// 			+"prefix cube: <http://purl.org/linked-data/cube#>"
					// 			+"prefix area: <http://opendatacommunities.org/def/ontology/geography/>"
					// 			+"prefix period: <http://opendatacommunities.org/def/ontology/time/>"
					// 			+"prefix rank: <http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/>"
					// 			+"select distinct ?s ?type ?label ?dataset ?refarea ?refperiod ?rank"
					// 			+"where {"
					// 			+"	?s rdfns:type ?type."
					// 			+"	?s rdfs:label ?label."
					// 			+"	?s cube:dataSet ?dataset."
					// 			+"	?s area:refArea ?refarea."
					// 			+"	?s period:refPeriod ?refperiod."
					// 			+"	?s rank:imdHealthRank ?rank."
					// 			+"	{"
					// 			+"		select distinct ?s"
					// 			+"		where {?s ?p ?o ."
					// 			+"			FILTER regex(?o, 'manchester', 'i')"
					// 			+"		}"
					// 			+"	}" 
					// 			+"} order by ?s";
					// var api = "http://localhost:8890/sparql?default-graph-uri=http%3A%2F%2Flocalhost%3A8890%2Fimd%2Frank%2Fhealth&query=prefix+id%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdata%2Fsocietal-wellbeing%2Fdeprivation%2Fimd-health-rank-2010%2F%3E%0D%0Aprefix+rdfns%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0Aprefix+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0Aprefix+cube%3A+%3Chttp%3A%2F%2Fpurl.org%2Flinked-data%2Fcube%23%3E%0D%0Aprefix+area%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Fontology%2Fgeography%2F%3E%0D%0Aprefix+period%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Fontology%2Ftime%2F%3E%0D%0Aprefix+rank%3A+%3Chttp%3A%2F%2Fopendatacommunities.org%2Fdef%2Fontology%2Fsocietal-wellbeing%2Fdeprivation%2F%3E%0D%0A%0D%0Aselect+distinct+%3Fs+%3Ftype+%3Flabel+%3Fdataset+%3Frefarea+%3Frefperiod+%3Frank%0D%0Awhere+%7B%0D%0A%09%3Fs+rdfns%3Atype+%3Ftype.%0D%0A%09%3Fs+rdfs%3Alabel+%3Flabel.%0D%0A%09%3Fs+cube%3AdataSet+%3Fdataset.%0D%0A%09%3Fs+area%3ArefArea+%3Frefarea.%0D%0A%09%3Fs+period%3ArefPeriod+%3Frefperiod.%0D%0A%09%3Fs+rank%3AimdHealthRank+%3Frank.%0D%0A%09%7B%0D%0A%09%09select+distinct+%3Fs%0D%0A%09%09where+%7B%3Fs+%3Fp+%3Fo+.%0D%0A%09%09%09FILTER+regex%28%3Fo%2C+%22manchester%22%2C+%22i%22%29%0D%0A%09%09%7D%0D%0A%09%7D+%0D%0A%7D+order+by+%3Fs&format=json&timeout=0&debug=on"
					var api = "http://localhost:8890/sparql?query=" + query + "&format=json";
					console.log(api);
					app.http.get(api, function(res){
					    var body = '';

					    res.on('data', function(chunk){
					        body += chunk;
					    });

					    res.on('end', function(){
					        var dt = JSON.parse(body);
					        dt.results.title = dataset;
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
					callback(err, results);
				});
			}
		], function(err, results){
			if (err) console.log(error);
			// console.log(results[1]);
			res.render('visualisation.pug', { 
				active: "home", 
				categories: results[0],
				ds: results[1] 
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
				res.render('list.pug', { 
					active:"datasets", 
					categories: categories });
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