module.exports = function (app, models){

	var filter = " { select distinct ?Subject"
				+" where {?Subject ?p ?o ."
				+" FILTER regex(?o, 'manchester', 'i')"
				+" } } "

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
					+ filter
					+ " } } order by ?Subject limit 10";
			callback(err, query);
		});
	}

	this.getChartQuery = function(dataset, callback){
		var attrs = [dataset.chartAttributes.x, dataset.chartAttributes.y];
		this.getAttributesAndConditions(attrs, function(err, result){
			if (err) console.log(error);
			var graph = " graph " + "<" + dataset.namedGraph + ">";
			var query = "select distinct" + result.attrs
					+ " where {" + graph
					+ " {" + result.conds
					+ filter
					+ " } } order by ?Subject limit 10";
			callback(err, query);
		});
	}

	this.getQuery = function(namedGraph, callback){
		var queryString = " select distinct ?Subject ?Type ?Label ?Dataset ?RefPeriod ?RefArea ?Area ?Rank ?Longitude ?Latitude"
						+ " from <http://localhost:8890/imd/rank/health>"
						+ " from <http://localhost:8890/location/lsoa>"
						+ " where {"
						+ " ?Subject <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?Type."
						+ " ?Subject <http://www.w3.org/2000/01/rdf-schema#label> ?Label."
						+ " ?Subject <http://purl.org/linked-data/cube#dataSet> ?Dataset."
						+ " ?Subject <http://opendatacommunities.org/def/ontology/time/refPeriod> ?RefPeriod."
						+ " ?Subject <http://opendatacommunities.org/def/ontology/geography/refArea> ?RefArea."
						+ " ?Subject <http://opendatacommunities.org/def/ontology/societal-wellbeing/deprivation/imdHealthRank> ?Rank."
						+ " ?RefArea <http://www.w3.org/2000/01/rdf-schema#label> ?Area."
						+ " ?RefArea <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?Longitude."
						+ " ?RefArea <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?Latitude."
						+ " {"
						+ " select distinct ?Subject"
						+ " where { ?Subject ?p ?o"
						+ " FILTER regex(?o, 'manchester', 'i')"
						+ " }"
						+ " 	}" 
						+ " } order by ?Subject limit 10";
		callback(null, queryString);
	}

	return this;
}