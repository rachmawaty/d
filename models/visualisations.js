module.exports = function(mongoose) {
	var collection = 'visualisations';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		datasetid: ObjectId,
		type: String, //enumerate: chart || map || table
		chart: {
			xheader: String, //to get the header of the column for xdata
			yheader: String, //to get the header of the column for ydata
			xtitle: String, //to set as the x-axis title
			ytitle: String //to set as the x-axis title
		},
		map: {
			referencearea: String,
			labelarea: String,
			longitude: String,
			latitude: String,
			information: String
		},
		table: {
			headers: Array, //array of headers in order
			information: String 
		} 
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, visualisations) {
			callback(err, visualisations);
		});
	};

	model.findById = function(id, callback) {
		model.findOne({_id: id}, function(err, visualisation) {
			callback(err, visualisation);
		});
	};

	model.findByDatasetId = function(datasetid, callback) {
		model.find({datasetid: datasetid}, function(err, visualisations) {
			callback(err, visualisations);
		});
	};

	model.findByDatasetIdAndType = function(datasetid, type, callback) {
		model.findOne({datasetid: datasetid, type: type}, function(err, visualisation) {
			callback(err, visualisation);
		});
	};

	model.updateChart = function(id, chart, callback) {
		var conditions = {_id: id}
	        , update = { $set: { 
	        	chart: chart
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateMap = function(id, map, callback) {
		var conditions = {_id: id}
	        , update = { $set: { 
	        	map: map
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.updateTable = function(id, table, callback) {
		var conditions = {_id: id}
	        , update = { $set: { 
	        	table: table
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log(err);
          console.log(numAffected + 'updated');
          callback(err);
        });
	};

	model.newChart = function(datasetid, xheader, yheader, xtitle, ytitle, callback ) {
		var visualisation = new model ({
			_id: new mongoose.Types.ObjectId(),
			datasetid: datasetid,
			type: 'chart',
			chart: {
				xheader: xheader,
				yheader: yheader,
				xtitle: xtitle,
				ytitle: ytitle
			}
	    });

		visualisation.save(function(err) {
			if (err) console.log(err);
			callback(err, visualisation);
		});
	};

	model.newMap = function(datasetid, referencearea, labelarea, longitude, latitude, information, callback ) {
		var visualisation = new model ({
			_id: new mongoose.Types.ObjectId(),
			datasetid: datasetid,
			type: 'map',
			map: {
				referencearea: referencearea,
				labelarea: labelarea,
				longitude: longitude,
				latitude: latitude,
				information: information
			}
	    });

		visualisation.save(function(err) {
			if (err) console.log(err);
			callback(err, visualisation);
		});
	};

	model.newTable = function(datasetid, headers, information, callback) {
		var visualisation = new model ({
			_id: new mongoose.Types.ObjectId(),
			datasetid: datasetid,
			type: 'table',
			table: { 
				headers: headers,
				information: information
			}
	    });

		visualisation.save(function(err) {
			if (err) console.log(err);
			callback(err, visualisation);
		});
	};

	return this;
}
