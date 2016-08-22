module.exports = function(mongoose) {
	var collection = 'categories';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		parentid: ObjectId,
		label: String,
		level: Number, //0: parent, 1: child
		idxname: String,
		parentidxname: String
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

	model.findByIdxName = function(idxname, callback) {
		model.findOne({idxname: idxname}, function(err, category) {
			callback(err, category);
		});
	};

	model.findByLevel = function(level, callback) {
		model.find({level: level}, function(err, categories) {
			if (err) console.log(err);
			callback(err, categories);
		});
	};

	model.findByParentId = function(parentid, callback) {
		model.find({parentid: parentid}, function(err, categories) {
			if (err) console.log(err);
			callback(err, categories);
		});
	};

	model.findByParentIdxName = function(parentidxname, callback) {
		model.find({parentidxname: parentidxname}, function(err, categories) {
			if (err) console.log(err);
			callback(err, categories);
		});
	};

	model.updateParentId = function(id, parentid, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	parentid: parentid
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.newCategory = function(label, level, idxname, parentidxname, callback) {
		var category = new model ({
			_id: new mongoose.Types.ObjectId(),
			label: label,
			level:level,
			idxname: idxname,
			parentidxname: parentidxname
	    });

		category.save(function(err) {
			if (err) console.log(err);
			callback(err, category);
		});
	};

	return this;
}
