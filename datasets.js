module.exports = function(app) {

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
		var query = "select distinct * where {"
				+" ?id <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type ."
				+" ?id <http://localhost:2525/category> ?categoryid ."
				+" ?id <http://localhost:2525/dataset#title> ?title ."
				+" ?id <http://localhost:2525/dataset#idxname> ?idxname ."
				+" ?id <http://localhost:2525/dataset#query> ?query ."
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var datasets = dt.results.bindings;
			callback(err, datasets);
		});
	};

	model.findById = function(datasetid, callback) {
		var query = "select distinct * where {"
				+" <"+ datasetid +"> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type ."
				+" <"+ datasetid +"> <http://localhost:2525/category> ?categoryid ."
				+" <"+ datasetid +"> <http://localhost:2525/dataset#title> ?title ."
				+" <"+ datasetid +"> <http://localhost:2525/dataset#idxname> ?idxname ."
				+" <"+ datasetid +"> <http://localhost:2525/dataset#query> ?query ."
				+" }";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var dataset = dt.results.bindings;
			callback(err, dataset);
		});
	};

	model.findByIdxName = function(idxname, callback) {
		var query = "select distinct * where {"
				+" ?id <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type ."
				+" ?id <http://localhost:2525/category> ?categoryid ."
				+" ?id <http://localhost:2525/dataset#title> ?title ."
				+" ?id <http://localhost:2525/dataset#idxname> '"+ idxname +"'' ."
				+" ?id <http://localhost:2525/dataset#query> ?query ."
				+" }";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var dataset = dt.results.bindings;
			callback(err, dataset);
		});
	};

	model.findByCategoryId = function(categoryid, callback) {
		var query = "select distinct * where {"
				+" ?id <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?type ."
				+" ?id <http://localhost:2525/category> '"+ categoryid +"' ."
				+" ?id <http://localhost:2525/dataset#title> ?title ."
				+" ?id <http://localhost:2525/dataset#idxname> ?idxname ."
				+" ?id <http://localhost:2525/dataset#query> ?query ."
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var datasets = dt.results.bindings;
			callback(err, datasets);
		});
	};

	return this;
}
