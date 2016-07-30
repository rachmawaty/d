module.exports = function(mongoose) {
	var collection = 'locations';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		label: String,
		namedGraph
		idxName: String,
		parentId: ObjectId,
		parentIdxName: String,
		locLabel: String,
		long: String,
		lat: String
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, locations) {
			callback(err, locations);
		});
	};

	model.findById = function(locId, callback) {
		model.findOne({_id: locId}, function(err, location) {
			callback(err, location);
		});
	};

	model.findByParentId = function(parentId, callback) {
		model.find({parentId: parentId}, function(err, locations) {
			if (err) console.log(err);
			callback(err, locations);
		});
	};

	model.findByParentIdxName = function(parentIdxName, callback) {
		model.find({parentIdxName: parentIdxName}, function(err, locations) {
			if (err) console.log(err);
			callback(err, locations);
		});
	};

	model.updateParentId = function(id, parentId, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	parentId: parentId
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.newLocation = function(label, idxName, parentIdxName, callback ) {
		var location = new model ({
			_id: new mongoose.Types.ObjectId(),
			label: label,
			idxName: idxName,
			parentIdxName: parentIdxName
	    });

		category.save(function(err) {
			if (err) console.log(err);
			callback(err, category);
		});
	};

	return this;
}
