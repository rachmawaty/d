module.exports = function (app, models){

	this.filter = " { select distinct ?Subject"
				+" where {?Subject ?p ?o ."
				+" FILTER regex(?o, 'manchester', 'i')"
				+" } "

	this.getAttributes = function(predicates){
		var selects = " ?Subject";
		app.async.each(predicates, function(predicate, cb){
			var attr = " ?" + predicate.label;
			selects += attr;
			cb();
		}, function(err){
			if (err) console.log(err);
			return selects;
		});
	}

	this.getGraph = function(graphName){
		var graph = " graph " + "<" + graphName + ">";
		return graph;
	}

	this.getConditions = function(predicates, callback){
		var cond = "";
		app.async.each(predicates, function(predicate, cb){
			cond += " ?Subject <" + predicate.uri + "> ?" + predicate.label + ".";
			cb();
		}, function(err){
			if (err) console.log(err);
			return cond;
		});
	}

	this.getTableQuery = function(dataset, needFilter){
		var query = "select distinct" + this.getAttributes(dataset.predicates) 
					+ " where {" + this.getGraph(dataset.graphName)
					+ " {" + this.getConditions(dataset.predicates)
					+ " } } order by ?Subject";
		return query;
	}

	return this;
}