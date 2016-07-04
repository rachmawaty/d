module.exports = function(mongoose, async) {
	var collection = 'categories';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		_id: ObjectId,
		name: String,
		parent: ObjectId,
		level : Number,
		meta_title: String,
		meta_description: String
	});

	var model = mongoose.model(collection, schema);
	this.model = model;

	model.findAll = function(callback) {
		model.find({}, function(err, categories) {
			callback(err, categories);
		});
	};

	model.findById = function(category_id, callback) {
		model.findOne({_id: category_id}, function(err, category) {
			callback(err, category);
		});
	};

	model.findByParentId = function(parent_id, callback) {
		model.find({parent: parent_id}, function(err, categories) {
			var ret = [];
			for (var i=0;i<categories.length;++i) {
				ret.push(categories[i].toObject());
			}
			callback(err, ret);
		});
	};

	model.findByParentPermalink = function(parent_permalink, callback) {
		model.find({parent_permalink: parent_permalink}, function(err, categories) {
			var ret = [];
			for (var i=0;i<categories.length;++i) {
				ret.push(categories[i].toObject());
			}
			callback(err, ret);
		});
	};
	model.findByLevel = function(level, callback) {
		model.find({level:level}, function(err, categories) {
			if (err) logger.error(err);
			callback(err, categories);
		});
	};

	model.newCategory = function(name, permalink, parent, parent_permalink, number, level, callback ) {
		var category = new model ({
			_id: new mongoose.Types.ObjectId(),
			name:name,
			permalink:permalink,
			parent:parent,
			parent_permalink:parent_permalink,
			number:number,
			level:level
	      });
		category.save(function(err) {
			if (err) console.log(err);
			callback(err, category);
		});
	};

	model.getCategory = function(currentCategory, expectedCategory) {
		if (currentCategory._id.equals(expectedCategory)) {
		  return currentCategory;
		}
		else {
		  var result = null;
		  var i = 0;
		  var check = true;
		  while ((check) && (i<currentCategory.children.length)) {
		    if (currentCategory.children[i]._id.equals(expectedCategory)) {
		      check = false;
		      result = currentCategory.children[i];
		    } else {
		      result = model.getCategory(currentCategory.children[i], expectedCategory);
		      if (result!=null) {
		        check = false;
		      }
		      ++i;
		    }
		  }
		  return result;
		}
	};

	model.getCategoriesAndChildrenByPermalink = function(category_permalink, callback) {
		// return array of categories, including category_id and all childrens
		var category_name = "";
		model.findByPermalink(category_permalink, function(err, category) {
			if (category) {
				category_name = category.name;
				if (!category.parent) {
					// semua kategori
					model.find({}).select('_id').exec(function(err, categories) {
						if (err) logger.error(err);
						callback(err, categories, category_name);
					});
				} else if (category.parent_permalink == 'semua-kategori') {
					// top category
					model.findByParentPermalink(category_permalink, function(err, category) {
						var result = category;
						callback(err, result, category_name);
					})	
				} else {
					// sub category
					var result = [];
					model.findOne({permalink: category_permalink}, function(err, category) {
						result.push(category);
						callback(err, result, category_name);
					});
				}
			} else {
				callback(err, [], null);
			}
		});
	};

	model.getCategoriesByIds = function(categories, callback){
		var i = 0;
		var res = [];
		var loop = function(){
			if(i<categories.length){
				var category_id = categories[i];
				model.findById(category_id, function(err, category) {
					if (category) {
						if (!category.parent) {
							// semua kategori
							model.find({}).select('_id').exec(function(err, cat) {
								if (err) logger.error(err);
								for(var j=0; j<cat.length; j++){
									res.push(cat[j]);
								}
								i++;
								loop();
							});
						} else if (category.parent_permalink == 'semua-kategori') {
							// top category
							model.findByParentId(category_id, function(err, category) {
								for(var j=0; j < category.length; j++){
									res.push(category[j]);
								}
								i++;
								loop();
							})	
						} else {
							// sub category
							res.push(category);
							i++;
							loop();
						}
					}else{
						i++;
						loop();
					}
				});
			}else{
				callback(res);
			}
		}
		loop();
	}

	model.getThirdLevelCategoriesByPermalinks = function(categories, callback){
		var i = 0;
		var res = [];
		var res_direct = [];
		var loop = function(){
			if(i<categories.length){
				var category_permalink = categories[i];
				// console.log('===========getcategoriesbypermalinks');
				// console.log(category_permalink);
				model.findByPermalink(category_permalink, function(err, category) {
					if (category) {
						res_direct.push(category);
						if (category.level == 0) {
							// semua kategori
							model.findByLevel(3, function(err, cat) {
								if (err) logger.error(err);
								res = res.concat(cat);
								i++;
								loop();
							})
						} else if (category.level == 1) {
							// top category
							model.findByParentPermalink(category_permalink, function(err, subcategories) {
								async.each(subcategories, function(subcategory, cb_cat) {
									model.findByParentPermalink(subcategory.permalink,  function(err, cat) {
										if (err) logger.error(err);
										res = res.concat(cat);
										cb_cat();
									})
								}, function(err) {
									i++;
									loop();
								});
							})	
						} else if (category.level == 2) {
							// sub category
							model.findByParentPermalink(category_permalink,  function(err, cat) {
								if (err) logger.error(err);
								res = res.concat(cat);
								i++;
								loop();
							})
						} else if (category.level == 3) {
							// sub sub category
							res.push(category);
							i++;
							loop();
						}
					}else{
						i++;
						loop();
					}
				});
			}else{
				callback(null, res, res_direct);
			}
		}
		loop();
	},

	model.updateNumberByPermalink = function(permalink, number, callback) {
        var conditions = {permalink: permalink}
	        , update = { $set: { 
	        	number:number 
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log('Kleora ERROR: ' + err);
          console.log('update ' + numAffected + ' category: ' + permalink);
          callback(err);
        });
	};
	model.updateNamePermalinkById = function(id, name, permalink, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	name:name,
	        	permalink:permalink 
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log('Kleora ERROR: ' + err);
          console.log('update ' + numAffected + ' category: ' + permalink);
          callback(err);
        });
	};
	model.updateLevel = function(id, level, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	level:level
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log('Kleora ERROR: ' + err);
          console.log('update ' + numAffected + ' level');
          callback(err);
        });
	};
	model.updateLevelParentPermalink = function(id, level, parent_permalink, callback) {
        var conditions = {_id: id}
	        , update = { $set: { 
	        	level:level,
	        	parent_permalink:parent_permalink 
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) console.log('Kleora ERROR: ' + err);
          console.log('update ' + numAffected + ' level & parent permalink');
          callback(err);
        });
	};
	model.updatePermalinkMetaTitleDescriptionSeoTitle = function(oldPermalink, newPermalink, metaTitle, metaDescription, seoTitle, callback) {
        var conditions = {permalink: oldPermalink}
	        , update = { $set: { 
	        	permalink:newPermalink,
	        	meta_title:metaTitle,
	        	meta_description:metaDescription,
	        	seo_title:seoTitle
	        }}
	        , options = { multi: false };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) logger.error('Kleora ERROR: ' + err);
          console.log('update ' + numAffected + ' permalink, meta title, description');
          callback(err);
        });
	};
	model.updateParentPermalinkMultiple = function(oldPermalink, newPermalink, callback) {
        var conditions = {parent_permalink: oldPermalink}
	        , update = { $set: { 
	        	parent_permalink:newPermalink
	        }}
	        , options = { multi: true };
        model.update(conditions, update, options, function (err, numAffected) {
          if(err) logger.error('Kleora ERROR: ' + err);
          console.log('update ' + numAffected + ' parent permalink');
          callback(err);
        });
	};
	model.deleteCategoryByPermalink = function(permalink, callback) {
		model.remove({permalink: permalink}, function(err) {
	      console.log('Category ' + permalink + ' has been permanently deleted');
	      callback(err);
	    });
	};

	return this;
}
