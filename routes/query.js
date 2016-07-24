module.exports = function (app, models){

	this.filter = " { select distinct ?Subject"
				+" where {?Subject ?p ?o ."
				+" FILTER regex(?o, 'manchester', 'i')"
				+" } "

	this.getAttributes = function(predicates, callback){
		var selects = " ?Subject";
		app.async.each(predicates, function(predicate, cb){
			models.predicates.findByUri(predicate, function(err, pred){
				if (err) console.log(err);
				var attr = " ?" + pred.label;
				selects += attr;
				cb();
			});
		}, function(err){
			if (err) console.log(err);
			callback(err, selects);
		});
	}

	this.getConditions = function(predicates, callback){
		var conds = "";
		app.async.each(predicates, function(predicate, cb){
			models.predicates.findByUri(predicate, function(err, pred){
				if (err) console.log(err);
				conds += " ?Subject <" + pred.uri + "> ?" + pred.label + ".";
				cb();
			});
		}, function(err){
			if (err) console.log(err);
			callback(err, conds);
		});
	}

	this.getTableQuery = function(dataset, callback){
		app.async.parallel([
			function(callback){
				this.getAttributes(dataset.predicates, function(err, attrs){
					// console.log(attrs);
					callback(err, attrs);
				});
			}, function(callback){
				this.getConditions(dataset.predicates, function(err, conds){
					callback(err, conds);
				});
			}
		], function(err, results){
			if (err) console.log(error);
			var graph = " graph " + "<" + dataset.namedGraph + ">";
			console.log(graph);
			var query = "select distinct" + results[0]
					+ " where {" + graph
					+ " {" + results[1]
					+ " } } order by ?Subject limit 10";
			// console.log(query);
			callback(err, query);
		});
	}

	return this;
}