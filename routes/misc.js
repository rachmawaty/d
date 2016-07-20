module.exports = function (app, models){
	var addCategories = function(){
		var insertedCategories = [
		{label: 'Deprivation', level: 0, idxName: 'imd', parentIdxName: ''}, 
		{label: 'Public Transport', level: 0, idxName: 'tfgm', parentIdxName: ''}, 
		{label: 'Location', level: 0, idxName: 'location', parentIdxName: ''}, 
		{label: 'Rank', level: 1, idxName: 'rank', parentIdxName: 'imd'},
		{label: 'Score', level: 1, idxName: 'score', parentIdxName: 'imd'},
		{label: 'Bus', level: 1, idxName: 'bus', parentIdxName: 'tfgm'},
		{label: 'Tram', level: 1, idxName: 'tram', parentIdxName: 'tfgm'},
		{label: 'Train', level: 1, idxName: 'train', parentIdxName: 'tfgm'}];

		for(var i=0;i<insertedCategories.length;i++){
			var label = insertedCategories[i].label;
			var level = insertedCategories[i].level;
			var idxName = insertedCategories[i].idxName;
			var parentIdxName = insertedCategories[i].parentIdxName;
			// console.log(insertedCategories[i]);
			models.categories.newCategory(label, level, idxName, parentIdxName, function(err, cat){
				console.log(cat);
			});
		}
	}
	// addCategories();

	var getParentAndChildren = function(){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function (parent_category, cb_parent) {
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxname, function(err, children_categories){
					if (err) console.log(err);
					var c_categories = [];
					app.async.each(children_categories, function (child_category, cb_child) {
						c_categories.push(child_category.toObject());
						cb_child();
					}, function(err){
						if (err) console.log(err);
						p_category.children = c_categories;
						categories.push(p_category);
						cb_parent();
					});
				});
			}, function (err) {
				if (err) console.log(error);
				console.log(categories[0].children[0]);
			});
		});
	}
	// getParentAndChildren();

	var addDatasets = function(){
		//  label: label,
		// 	idxName: idxName,
		// 	sourceLink: sourceLink,
		// 	namedGraph: namedGraph,
		// 	categoryId: categoryId
		var insertedDatasets = [
		{label: 'Education', idxName: 'imd-score-education', sourceLink: '', namedGraph:'<http://localhost:8890/imd/score/education>', categoryId: '5789373a1822f78f17a12bea'}, 
		{label: 'Environment', idxName: 'imd-score-environment', sourceLink: '', namedGraph:'<http://localhost:8890/imd/score/environment>', categoryId: '5789373a1822f78f17a12bea'},
		{label: 'Health', idxName: 'imd-score-health', sourceLink: '', namedGraph:'<http://localhost:8890/imd/score/health>', categoryId: '5789373a1822f78f17a12bea'},
		{label: 'Education', idxName: 'imd-rank-education', sourceLink: '', namedGraph:'<http://localhost:8890/imd/rank/education>', categoryId: '5789373a1822f78f17a12be9'}, 
		{label: 'Environment', idxName: 'imd-rank-environment', sourceLink: '', namedGraph:'<http://localhost:8890/imd/rank/environment>', categoryId: '5789373a1822f78f17a12be9'},
		{label: 'Health', idxName: 'imd-rank-health', sourceLink: '', namedGraph:'<http://localhost:8890/imd/rank/health>', categoryId: '5789373a1822f78f17a12be9'}];

		for(var i=0;i<insertedDatasets.length;i++){
			var label = insertedDatasets[i].label;
			var idxName = insertedDatasets[i].idxName;
			var sourceLink = insertedDatasets[i].sourceLink;
			var namedGraph = insertedDatasets[i].namedGraph;
			var categoryId = insertedDatasets[i].categoryId;
			// console.log(insertedCategories[i]);
			models.datasets.newDataset(label, idxName, sourceLink, namedGraph, categoryId, function(err, dset){
				console.log(dset);
			});
		}
	}
	// addDatasets();

	var checkJSON = function(){
		var datasets = ["imd/score/health", "imd/score/education", "imd/score/environment"]
		for (var i = 0; i<datasets.length; i++){
			var namedGraph = "<http://localhost:8890/"+datasets[i]+">";
			console.log(namedGraph);
			var query = "select distinct * where {graph "+ namedGraph +" {?s ?p ?o}} order by ?s LIMIT 10";
			var api = "http://localhost:8890/sparql?query=" + query + "&format=json";
			app.http.get(api, function(res){
			    var body = '';

			    res.on('data', function(chunk){
			        body += chunk;
			    });

			    res.on('end', function(){
			        var dt = JSON.parse(body);
			        console.log("Got a response: ", dt.results.bindings[0].s);
			    });
			}).on('error', function(e){
			      console.log("Got an error: ", e);
			});
		}
	}
	// checkJSON();

	var getCategoriesAndDatasets = function(){
		models.categories.findByLevel(0, function(err, parent_categories){
			if (err) console.log(err);
			var categories = [];
			app.async.each(parent_categories, function (parent_category, cb_parent) {
				var p_category = parent_category.toObject();
				models.categories.findByParentIdxName(parent_category.idxName, function(err, children_categories){
					if (err) console.log(err);
					var c_categories = [];
					app.async.each(children_categories, function (child_category, cb_child) {
						var c_category = child_category.toObject();	
						models.datasets.findByCategoryId(c_category._id, function(err, datasets){
							if (err) console.log(err);
							var c_datasets = [];
							app.async.each(datasets, function(dataset, cb_dts){
								c_datasets.push(dataset.toObject());
								cb_dts();
							}, function(err){
								c_category.datasets = c_datasets;
								c_categories.push(c_category);
								cb_child();
							});
						});
					}, function(err){
						if (err) console.log(err);
						p_category.children = c_categories;
						categories.push(p_category);
						cb_parent();
					});
				});
			}, function (err) {
				if (err) console.log(error);
				for (var i=0;i<categories.length;i++){
					if (categories[i].children.length>0){
						for(var j=0;j<categories[i].children.length;j++){
							console.log(categories[i].label, categories[i].children[j].label);
							if (categories[i].children[j].datasets.length>0) {
								for (var k = 0; k<categories[i].children[j].datasets.length;k++){
									console.log(categories[i].children[j].datasets[k].label);
								}
							}
						}
					}
				}
			});
		});
	}
	// getDatasets();
}