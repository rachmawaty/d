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
		var query = "select distinct * where { "
				+" ?id <http://www.w3.org/2000/01/rdf-schema#label> ?label ."
				+" ?id <http://localhost:2525/category#idxname> ?idxname ."
				+" ?id <http://localhost:2525/category#level> ?level ."
				+" OPTIONAL { "
				+" ?id <http://localhost:2525/category#parentid> ?parentid ."
				+" ?parentid <http://localhost:2525/category#idxname> ?parentidxname ."
				+" }"
				+" } order by ?s";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var categories = dt.results.bindings;
			callback(err, categories);
		});
	};

	model.findById = function(categoryid, callback) {
		var query = "select distinct * where { "
				+" <"+ categoryid +"> <http://www.w3.org/2000/01/rdf-schema#label> ?label ."
				+" <"+ categoryid +"> <http://localhost:2525/category#idxname> ?idxname ."
				+" <"+ categoryid +"> <http://localhost:2525/category#level> ?level ."
				+" OPTIONAL { "
				+" <"+ categoryid +"> <http://localhost:2525/category#parentid> ?parentid ."
				+" ?parentid <http://localhost:2525/category#idxname> ?parentidxname ."
				+" } }";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var category = dt.results.bindings;
			callback(err, category);
		});
	};

	model.findByIdxName = function(idxname, callback) {
		var query = "select distinct * where { "
				+" ?id <http://www.w3.org/2000/01/rdf-schema#label> ?label ."
				+" ?id <http://localhost:2525/category#idxname> '"+ idxname +"' ."
				+" ?id <http://localhost:2525/category#level> ?level ."
				+" OPTIONAL { "
				+" ?id <http://localhost:2525/category#parentid> ?parentid ."
				+" ?parentid <http://localhost:2525/category#idxname> ?parentidxname ."
				+" }"
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var category = dt.results.bindings;
			callback(err, category);
		});
	};

	model.findByLevel = function(level, callback) {
		var query = "select distinct * where { "
				+" ?id <http://www.w3.org/2000/01/rdf-schema#label> ?label ."
				+" ?id <http://localhost:2525/category#idxname> ?idxname ."
				+" ?id <http://localhost:2525/category#level> '"+ level +"' ."
				+" OPTIONAL { "
				+" ?id <http://localhost:2525/category#parentid> ?parentid ."
				+" ?parentid <http://localhost:2525/category#idxname> ?parentidxname ."
				+" }"
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var categories = dt.results.bindings;
			callback(err, categories);
		});
	};

	model.findByParentId = function(parentid, callback) {
		var query = "select distinct * where { "
				+" ?id <http://www.w3.org/2000/01/rdf-schema#label> ?label ."
				+" ?id <http://localhost:2525/category#idxname> ?idxname ."
				+" ?id <http://localhost:2525/category#level> ?level ."
				+" ?id <http://localhost:2525/category#parentid> <"+ parentid +"> ."
				+" <"+ parentid +"> <http://localhost:2525/category#idxname> ?parentidxname ."
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var categories = dt.results.bindings;
			callback(err, categories);
		});
	};

	model.findByParentIdxName = function(parentidxname, callback) {
		var query = "select distinct * where { "
				+" ?id <http://www.w3.org/2000/01/rdf-schema#label> ?label ."
				+" ?id <http://localhost:2525/category#idxname> ?idxname ."
				+" ?id <http://localhost:2525/category#level> ?level ."
				+" ?id <http://localhost:2525/category#parentid> ?parentid ."
				+" ?parentid <http://localhost:2525/category#idxname> '"+ parentidxname +"' ."
				+" } order by ?id";
		callAPI(query, function(err, dt){
			var headers = dt.head.vars;
			var categories = dt.results.bindings;
			callback(err, categories);
		});
	};

	return this;
}
