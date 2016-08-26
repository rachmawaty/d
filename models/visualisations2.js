module.exports = function(app) {

	var model = {};
	this.model = model;

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

	model.findAll = function(callback) {
		var query = "select distinct * from <http://localhost:2525/visualisations> where { ?s ?p ?o } order by ?s";
		
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var vis = dt.results.bindings;
			callback(err, vis);
		});
	};

	model.findByDatasetIdAndType = function(datasetid, type, callback) {
		var chartQuery = "select distinct * from <http://localhost:2525/visualisations>"
						+" where {"
						+" ?id <http://localhost:2525/datasets> <"+ datasetid +"> ."
						+" ?id <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> 'chart' ."
						+" ?id <http://localhost:2525/vis/chart#xheader> ?xheader ."
						+" ?id <http://localhost:2525/vis/chart#yheader> ?yheader ."
						+" ?id <http://localhost:2525/vis/chart#xtitle> ?xtitle ."
						+" ?id <http://localhost:2525/vis/chart#ytitle> ?ytitle ."
						+" }";

		var mapQuery = "select distinct * from <http://localhost:2525/visualisations>"
						+" where {"
						+" ?id <http://localhost:2525/datasets> <"+ datasetid +"> ."
						+" ?id <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> 'map' ."
						+" ?id <http://localhost:2525/vis/map#referencearea> ?referencearea ."
						+" ?id <http://localhost:2525/vis/map#labelarea> ?labelarea ."
						+" ?id <http://localhost:2525/vis/map#longitude> ?longitude ."
						+" ?id <http://localhost:2525/vis/map#latitude> ?latitude ."
						+" ?id <http://localhost:2525/vis/map#information> ?information ."
						+" }";

		var query = (type == "chart") ? chartQuery : mapQuery;
		callAPI(query, function(err, dt){
			if (err) console.log(err);
			var headers = dt.head.vars;
			var vis = dt.results.bindings;
			callback(err, vis);
		});
	};

	return this;
}
