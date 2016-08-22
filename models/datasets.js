module.exports = function(mongoose) {
	var collection = 'datasets';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		categoryid: ObjectId,
		idxname: String,
		title: String,
		query: String,
		metadata: {
			namedgraph: String,
			description: String,
			sourcelink: String,
			yearorperiod: String,
			lastupdate: Date
		},
		vocabs: Array
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, datasets) {
			callback(err, datasets);
		});
	};

	model.findById = function(id, callback) {
		model.findOne({_id: id}, function(err, dataset) {
			callback(err, dataset);
		});
	};

	model.findByIdxName = function(idxname, callback) {
		model.findOne({idxname: idxname}, function(err, dataset) {
			callback(err, dataset);
		});
	};

	model.findByCategoryId = function(categoryid, callback) {
		model.find({categoryid: categoryid}, function(err, datasets) {
			if (err) console.log(err);
			callback(err, datasets);
		});
	};

	model.getQueryByIdxName = function(idxname, callback) {
		model.findOne({idxname: idxname}, function(err, dataset) {
			callback(err, dataset.query);
		});
	};

	model.updateCategoryId = function(idxname, categoryid, callback) {
        var conditions = {idxname: idxname}
	        , update = { $set: { 
	        	categoryid: categoryid
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateMetadata = function(idxname, namedgraph, description, sourcelink, yearorperiod, lastupdate, callback) {
        var metadata = {};
        metadata.namedgraph = namedgraph;
        metadata.description = description;
        metadata.sourcelink = sourcelink;
        metadata.yearorperiod = yearorperiod;
        metadata.lastupdate = lastupdate;
        var conditions = {idxname: idxname}
	        , update = { $set: { 
	        	metadata: metadata
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateVocabs = function(id, vocabs, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	vocabs: vocabs
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateSourceLink = function(id, sourcelink, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	sourcelink: sourcelink
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateYearOrPeriod = function(id, yearorperiod, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	yearorperiod: yearorperiod
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateQuery = function(idxname, query, callback) {
        var conditions = {idxname: idxname}
	        , update = { $set: { 
	        	query: query
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};	

	model.newDataset = function(categoryid, idxname, title, query, callback ) {
		var dataset = new model ({
			_id: new mongoose.Types.ObjectId(),
			categoryid: categoryid,
			idxname: idxname,
			title: title,
			query: query
	    });

		dataset.save(function(err) {
			if (err) console.log(err);
			callback(err, dataset);
		});
	};

	return this;
}
