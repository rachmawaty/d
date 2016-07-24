module.exports = function(mongoose) {
	var collection = 'predicates';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		label: String,
		uri: String,
		prefix: String,
		namespace: String
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, predicates) {
			callback(err, predicates);
		});
	};

	model.findById = function(predicateId, callback) {
		model.findOne({_id: predicateId}, function(err, predicate) {
			callback(err, predicate);
		});
	};

	model.findByUri = function(uri, callback) {
		model.findOne({uri: uri}, function(err, predicate) {
			if (err) console.log(err);
			callback(err, predicate);
		});
	};

	model.getLabelByUri = function(uri, callback) {
		model.findOne({uri: uri}, function(err, predicate) {
			if (err) console.log(err);
			callback(err, predicate.label);
		});
	};

	model.updateLabel = function(id, label, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	label: label
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateUri = function(id, uri, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	uri: uri
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updatePrefix = function(id, prefix, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	prefix: prefix
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateNamespace = function(id, namespace, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	namespace: namespace
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.newPredicate = function(label, uri, prefix, namespace, callback ) {
		var predicate = new model ({
			_id: new mongoose.Types.ObjectId(),
			label: label,
			uri: uri,
			prefix: prefix,
			namespace
	    });

		predicate.save(function(err) {
			if (err) console.log(err);
			callback(err, predicate);
		});
	};

	return this;
}
