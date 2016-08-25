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
		var query = "select distinct * from <http://localhost:2525/datasets>"
				+" from <http://localhost:2525/metadatas>" 
				+" where {"
				+" ?id <http://localhost:2525/category> ?categoryid ."
				+" ?id <http://localhost:2525/dataset#title> ?title ."
				+" ?id <http://localhost:2525/dataset#idxname> ?idxname ."
				+" ?id <http://localhost:2525/dataset#query> ?query ."
				+" ?id <http://purl.org/dc/terms/description> ?description ."
				+" ?id <http://localhost:2525/metadata#sourcelink> ?sourcelink ."
				+" ?id <http://localhost:2525/metadata#namedgraph> ?namedgraph ."
				+" ?id <http://localhost:2525/metadata#yearorperiod> ?yearorperiod ."
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var datasets = dt.results.bindings;
			callback(err, datasets);
		});
	};

	model.findById = function(datasetid, callback) {
		var query = "select distinct * from <http://localhost:2525/datasets>"
				+" from <http://localhost:2525/metadatas>" 
				+" where {"
				+" <"+ datasetid +"> <http://localhost:2525/category> ?categoryid ."
				+" <"+ datasetid +"> <http://localhost:2525/dataset#title> ?title ."
				+" <"+ datasetid +"> <http://localhost:2525/dataset#idxname> ?idxname ."
				+" <"+ datasetid +"> <http://localhost:2525/dataset#query> ?query ."
				+" ?id <http://purl.org/dc/terms/description> ?description ."
				+" ?id <http://localhost:2525/metadata#sourcelink> ?sourcelink ."
				+" ?id <http://localhost:2525/metadata#namedgraph> ?namedgraph ."
				+" ?id <http://localhost:2525/metadata#yearorperiod> ?yearorperiod ."
				+" }";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var dataset = dt.results.bindings;
			callback(err, dataset);
		});
	};

	model.findByIdxName = function(idxname, callback) {
		var query = "select distinct * from <http://localhost:2525/datasets>"
				+" from <http://localhost:2525/metadatas>" 
				+" where {"
				+" ?id <http://localhost:2525/category> ?categoryid ."
				+" ?id <http://localhost:2525/dataset#title> ?title ."
				+" ?id <http://localhost:2525/dataset#idxname> '"+ idxname +"' ."
				+" ?id <http://localhost:2525/dataset#query> ?query ."
				+" ?id <http://purl.org/dc/terms/description> ?description ."
				+" ?id <http://localhost:2525/metadata#sourcelink> ?sourcelink ."
				+" ?id <http://localhost:2525/metadata#namedgraph> ?namedgraph ."
				+" ?id <http://localhost:2525/metadata#yearorperiod> ?yearorperiod ."
				+" }";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var dataset = dt.results.bindings;
			callback(err, dataset);
		});
	};

	model.findByCategoryId = function(categoryid, callback) {
		var query = "select distinct * from <http://localhost:2525/datasets>"
				+" from <http://localhost:2525/metadatas>" 
				+" where {"
				+" ?id <http://localhost:2525/category> <"+ categoryid +"> ."
				+" ?id <http://localhost:2525/dataset#title> ?title ."
				+" ?id <http://localhost:2525/dataset#idxname> ?idxname ."
				+" ?id <http://localhost:2525/dataset#query> ?query ."
				+" ?id <http://purl.org/dc/terms/description> ?description ."
				+" ?id <http://localhost:2525/metadata#sourcelink> ?sourcelink ."
				+" ?id <http://localhost:2525/metadata#namedgraph> ?namedgraph ."
				+" ?id <http://localhost:2525/metadata#yearorperiod> ?yearorperiod ."
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var datasets = dt.results.bindings;
			callback(err, datasets);
		});
	};

	return this;
}
