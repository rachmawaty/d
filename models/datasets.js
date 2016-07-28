module.exports = function(mongoose) {
	var collection = 'datasets';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		label: String,
		idxName: String,
		sourceLink: String,
		description: String,
		namedGraph: String,
		categoryId: ObjectId,
		hasLocation: Boolean,
		locationId: ObjectId,
		description: String,
		predicates: Array,
		chartAttributes: {
			x: String,
			y: String
		},
		locationAttr: String
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, datasets) {
			callback(err, datasets);
		});
	};

	model.findById = function(datasetId, callback) {
		model.findOne({_id: datasetId}, function(err, dataset) {
			callback(err, dataset);
		});
	};

	model.findByIdxName = function(idxName, callback) {
		model.findOne({idxName: idxName}, function(err, dataset) {
			callback(err, dataset);
		});
	};

	model.findByCategoryId = function(categoryId, callback) {
		model.find({categoryId: categoryId}, function(err, datasets) {
			if (err) console.log(err);
			callback(err, datasets);
		});
	};

	model.getChartAttributes = function(datasetId, callback) {
		model.findOne({_id: datasetId}, function(err, dataset) {
			callback(err, dataset.chartAttributes);
		});
	};

	model.updateChartAttributes = function(id, chartAttributes, callback) {
		var conditions = {_id: id}
	        , update = { $set: { 
	        	chartAttributes: chartAttributes
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateDescription = function(id, description, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	description: description
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updatePredicates = function(id, predicates, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	predicates: predicates
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateSourceLink = function(id, sourceLink, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	sourceLink: sourceLink
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateLocation = function(id, hasLocation, locationId, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	hasLocation: hasLocation,
	        	locationId: locationId
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.newDataset = function(label, idxName, sourceLink, namedGraph, categoryId, callback ) {
		var dataset = new model ({
			_id: new mongoose.Types.ObjectId(),
			label: label,
			idxName: idxName,
			sourceLink: sourceLink,
			namedGraph: namedGraph,
			categoryId: categoryId,
			hasLocation: false,
			description: "Default description"
	    });

		dataset.save(function(err) {
			if (err) console.log(err);
			callback(err, dataset);
		});
	};

	return this;
}
