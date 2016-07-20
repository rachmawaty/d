module.exports = function(mongoose) {
	var collection = 'datasets';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		label: String,
		idxName: String,
		sourceLink: String,
		namedGraph: String,
		categoryId: ObjectId,
		hasLocation: Boolean,
		locationId: ObjectId
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, datasets) {
			callback(err, datasets);
		});
	};

	model.findById = function(category_id, callback) {
		model.findOne({_id: category_id}, function(err, dataset) {
			callback(err, dataset);
		});
	};

	model.findByLevel = function(level, callback) {
		model.find({level: level}, function(err, datasets) {
			if (err) console.log(err);
			callback(err, datasets);
		});
	};

	model.findByParentIdxName = function(parentIdxName, callback) {
		model.find({parentIdxName: parentIdxName}, function(err, datasets) {
			if (err) console.log(err);
			callback(err, datasets);
		});
	};

	model.newDataset = function(label, idxName, sourceLink, namedGraph, categoryId, callback ) {
		var dataset = new model ({
			_id: new mongoose.Types.ObjectId(),
			label: label,
			idxName: idxName,
			sourceLink: sourceLink,
			namedGraph: namedGraph,
			categoryId: categoryId
	    });

		dataset.save(function(err) {
			if (err) console.log(err);
			callback(err, dataset);
		});
	};

	return this;
}
