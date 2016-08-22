module.exports = function(mongoose) {
	var collection = 'items';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		datasetid: ObjectId,
		headers: Array,
		attributes: [{
			name: String,
			type: String,
			value: String
		}]
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findByDatasetId = function(callback) {
		model.find({}, function(err, items) {
			callback(err, items);
		});
	};

	model.newItem = function(datasetid, headers, attributes, callback) {
		var category = new model ({
			_id: new mongoose.Types.ObjectId(),
			datasetid: datasetid,
			headers: headers,
			attributes: attributes
	    });

		category.save(function(err) {
			if (err) console.log(err);
			callback(err, category);
		});
	};

	return this;
}
