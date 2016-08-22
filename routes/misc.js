module.exports = function (app, models){

	var insertCategories = function(){
		models.categories.newCategory("LSOA", 1, "lsoa", "location", function(err, cat){
			console.log(cat);
		});
	}
	// insertCategories();

	var updateQuery = function(){
		// categoryid, idxname, title, query
		
		// models.datasets.newDataset("5789373a1822f78f17a12bea", "imd-score-"+idx, title, query, function(err, to){

		// });
		var list = ["crime", "education", "employment", "environment", "health", "housing", "income"];
		var list2 = ["Crime", "Education", "Employment", "Environment", "Health", "Housing", "Income"];
		for (var i=0;i<list.length;i++){
			var idx = list[i];
			var title = list2[i];
			var query = "select distinct ?Area ?"+title+"Rank ?Longitude ?Latitude ?Subject ?Type ?Label ?Dataset ?ReferencePeriod ?ReferenceArea" 
					+ " from <http://localhost:8890/imd/rank/"+idx+">"
					+ " from <http://localhost:8890/location/lsoa> where" 
					+ " { ?Subject <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?Type."
					+ " ?Subject <http://www.w3.org/2000/01/rdf-schema#label> ?Label."
					+ " ?Subject <http://purl.org/linked-data/cube#dataSet> ?Dataset."
					+ " ?Subject <http://opendatacommunities.org/def/ontology/time/refPeriod> ?ReferencePeriod."
					+ " ?Subject <http://opendatacommunities.org/def/ontology/geography/refArea> ?ReferenceArea."
					+ " ?Subject <http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imd"+title+"Rank> ?"+title+"Rank."
					+ " ?ReferenceArea <http://www.w3.org/2000/01/rdf-schema#label> ?Area." 
					+ " ?ReferenceArea <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?Longitude." 
					+ " ?ReferenceArea <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?Latitude." 
					+ " { select distinct ?Subject where"
					+ "	{ ?Subject ?p ?o FILTER regex(?o, 'manchester', 'i') } \t} }" 
					+ " order by ?Subject";
			models.datasets.updateQuery("imd-rank-"+idx, query, function(err){

			});
		}
	}
	// updateQuery();

	var updateMetadata = function(rankorscore, idx){
		var namedgraph = "http://localhost:8890/imd/"+rankorscore+"/"+idx;
		var description = "The English Indices of Deprivation provide a relative measure of deprivation at small area level across England. Areas are ranked from least deprived to most deprived on seven different dimensions of deprivation and an overall composite measure of multiple deprivation. Most of the data underlying the 2010 indices are for the year 2008. The indices have been constructed by the Social Disadvantage Research Centre at the University of Oxford for the Department for Communities and Local Government. All figures can only be reproduced if the source (Department for Communities and Local Government, Indices of Deprivation 2010) is fully acknowledged. The domains used in the Indices of Deprivation 2010 are: income deprivation; employment deprivation; health deprivation and disability; education deprivation; crime deprivation; barriers to housing and services deprivation; and living environment deprivation. Each of these domains has its own scores and ranks, allowing users to focus on specific aspects of deprivation. Because the indices give a relative measure, they can tell you if one area is more deprived than another but not by how much. For example, if an area has a rank of 40 it is not half as deprived as a place with a rank of 20. The Index of Multiple Deprivation was constructed by combining scores from the seven domains. When comparing areas, a higher deprivation score indicates a higher proportion of people living there who are classed as deprived. But as for ranks, deprivation scores can only tell you if one area is more deprived than another, but not by how much. This dataset was created from a spreadsheet provided by the Department of Communities and Local Government, which can be downloaded [here](https://www.gov.uk/government/publications/english-indices-of-deprivation-2010). The method for calculating the IMD score and underlying indicators is detailed in the report '[The English Indices of Deprivation 2010: Technical Report](https://www.gov.uk/government/publications/english-indices-of-deprivation-2010-technical-report)'. The data is represented here as Linked Data, using the Data Cube ontology.";
		var sourcelink = "http://opendatacommunities.org/data/societal-wellbeing/deprivation/imd-"+idx+"-"+rankorscore+"-2010";
		var yearorperiod = "2010";
		var lastupdate = "";
		var idxname = "imd-"+rankorscore+"-"+idx;
		models.datasets.updateMetadata(idxname, namedgraph, description, sourcelink, yearorperiod, lastupdate, function(err){

		});
	}
	// updateMetadata("score", "income");

	var storedata = function(callback){
		models.datasets.findByIdxName("imd-score-housing", function(err, dataset){
			var query = dataset.query;
			var api = "http://localhost:8890/sparql?query="+encodeURIComponent(query)+"&format=json";

			app.http.get(api, function(res){
			    var body = '';

			    res.on('data', function(chunk){
			        body += chunk;
			    });

			    res.on('end', function(){
			        var dt = JSON.parse(body);
			        // console.log(dt);
			        callback(null, dataset._id, dt.head.vars, dt.results.bindings);
			    });
			}).on('error', function(e){
			    console.log("Got an error: ", e);
			    callback(e, null, null);
			});
		});
	}
	// storedata(function(err, datasetid, headers, items){
	// 	// console.log(datasetid);
	// 	// console.log(headers);
	// 	var list = ["crime", "education", "employment", "environment", "health", "housing", "income"];
	// 	app.async.eachSeries(list, function(domain, cb){
	// 		models.datasets.findByIdxName("imd-score-"+domain, function(err, dataset){
	// 			// models.visualisations.newChart(dataset._id, "Area", dataset.title+"Score", "Area", "Score", function(err, vis){
	// 			// 	console.log(vis);
	// 			// 	cb();
	// 			// });
	// 			models.visualisations.newMap(dataset._id, "ReferenceArea", "Area", "Longitude", "Latitude", dataset.title+"Score", function(err, vis){
	// 				console.log(vis);
	// 			});
	// 		});
	// 	}, function(err){

	// 	});
	// });
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
}