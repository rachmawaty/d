module.exports = function (app, models){

	app.get('/d/:idxname', function(req, res){
		var idxname = req.params.idxname;
		models.datasets.findByIdxName(idxname, function(err, dataset){
			if (err) console.log(err);
			models.categories.findById(dataset.categoryId, function(err, category){
				if (err) console.log(err);
				models.categories.findByIdxName(category.parentIdxName, function(err, parentCategory){
					if (err) console.log(err);
					var breadcrumb = parentCategory.label + " > " + category.label + " > " + dataset.label;
					res.render('data.pug', { dataset: dataset, breadcrumb: breadcrumb, active:"datasets" });
				});
			});
		});
	});
}