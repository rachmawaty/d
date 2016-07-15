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
}