module.exports = function(mongoose) {
	var collection = 'categories';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		label: String,
		level: Number, // (0 == parent, 1 == child)
		idxName: String,
		parentId: ObjectId,
		parentIdxName: String,
		visualisationType: Array
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, categories) {
			callback(err, categories);
		});
	};

	model.findById = function(categoryId, callback) {
		model.findOne({_id: categoryId}, function(err, category) {
			callback(err, category);
		});
	};

	model.findByIdxName = function(idxName, callback) {
		model.findOne({idxName: idxName}, function(err, category) {
			callback(err, category);
		});
	};

	model.findByLevel = function(level, callback) {
		model.find({level: level}, function(err, categories) {
			if (err) console.log(err);
			callback(err, categories);
		});
	};

	model.findByParentId = function(parentId, callback) {
		model.find({parentId: parentId}, function(err, categories) {
			if (err) console.log(err);
			callback(err, categories);
		});
	};

	model.findByParentIdxName = function(parentIdxName, callback) {
		model.find({parentIdxName: parentIdxName}, function(err, categories) {
			if (err) console.log(err);
			callback(err, categories);
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

	model.newCategory = function(label, level, idxName, parentIdxName, callback ) {
		var category = new model ({
			_id: new mongoose.Types.ObjectId(),
			label: label,
			level:level,
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
