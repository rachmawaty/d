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

	this.getAttributesAndConditions = function(predicates, callback){
		var attrs = " ?Subject";
		var conds = "";
		var result = [];
		app.async.each(predicates, function(predicate, cb){
			models.predicates.findByUri(predicate, function(err, pred){
				if (err) console.log(err);
				var attr = " ?" + pred.label;
				attrs += attr;
				conds += " ?Subject <" + pred.uri + "> ?" + pred.label + ".";
				cb();
			});
		}, function(err){
			if (err) console.log(err);
			result.attrs = attrs;
			result.conds = conds;
			callback(err, result);
		});
	}

	// this.getTableQuery = function(dataset, regexFilter, limit, callback){
	this.getTableQuery = function(dataset, callback){
		this.getAttributesAndConditions(dataset.predicates, function(err, result){
			if (err) console.log(error);
			var graph = " graph " + "<" + dataset.namedGraph + ">";
			var query = "select distinct" + result.attrs
					+ " where {" + graph
					+ " {" + result.conds
					+ " } } order by ?Subject limit 10";
			callback(err, query);
		});
	}

	return this;
}