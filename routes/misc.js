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
		// label: label,
		// 	idxName: idxName,
		// 	sourceLink: sourceLink,
		// 	namedGraph: namedGraph,
		// 	categoryId: categoryId
		var insertedDatasets = [
		{label: 'Deprivation', idxName: 'imd', sourceLink: '', namedGraph:'', categoryId: ''}, 
		{label: 'Deprivation', idxName: 'imd', sourceLink: '', namedGraph:'', categoryId: ''}];

		for(var i=0;i<insertedDatasets.length;i++){
			var label = insertedDatasets[i].label;
			var idxName = insertedDatasets[i].idxName;
			var sourceLink = insertedDatasets[i].sourceLink;
			var namedGraph = insertedDatasets[i].namedGraph;
			var categoryId = insertedDatasets[i].categoryId;
			// console.log(insertedCategories[i]);
			models.datasets.newCategory(label, idxName, sourceLink, namedGraph, categoryId, function(err, dset){
				console.log(dset);
			});
		}
	}

	// addDatasets();

	/**** coba RDFSTORE ****/
	var storeInRDFStore = function(){
		console.log("***** RDFStore *****");
		console.log("**** Create Store ****");
		app.rdfstore.create(function(err, store) {
			console.log("***** store.functionMap *****");
			console.log(store.functionMap);
			console.log("***** store.customFns *****");
			console.log(store.customFns);
			console.log("***** store.engine.backend *****");
			console.log(store.engine.backend);
			console.log("***** store.engine.lexicon *****");
			console.log(store.engine.lexicon);
			console.log("***** store.engine.rdfLoader *****");
			console.log(store.engine.rdfLoader);
			console.log("***** store.engine.callbacksBackend *****");
			console.log(store.engine.callbacksBackend);
		});

		console.log("****************************************");
	}

	// storeInRDFStore();

	var tryRDFStore = function(){
		console.log("***** RDFStore *****");
		console.log("**** Create Store ****");
		var fileString = app.fs.readFileSync(app.dir + '/rdf/imd-rank-education.nt').toString();
		app.rdfstore.create(function(err, store) {
			// var parser = app.n3.Parser(),
   //  		rdfStream = app.fs.createReadStream(fileString);
			// parser.parse(rdfStream, console.log);
			// var streamParser = app.n3.StreamParser(),
   //  		rdfStream = app.fs.createReadStream(fileString);
			// rdfStream.pipe(streamParser);
			// streamParser.pipe(new SlowConsumer());
			 
			// function SlowConsumer() {
			//   var writer = new require('stream').Writable({ objectMode: true });
			//   writer._write = function (triple, encoding, done) {
			//     console.log(triple);
			//     setTimeout(done, 200000);
			//   };
			//   return writer;
			// }
			store.load("text/n3", fileString, "<http://example.org/imd>", function(err, loaded) {
				if (err) console.log(err);
				console.log("triples loaded: ", loaded);
				var query = "SELECT * { GRAPH <http://example.org/imd> { ?s ?p ?o } } limit 10";
				store.execute(query, function(err, results){
					console.log(err, results.length);
				});
				
			// 	store.registeredGraphs(function(err, res){
			// 		console.log(res);
			// 		store.graph("http://example.org/imd", function(err, res){
			// 			if (err) console.log("ERR: " + err);
			// 			console.log(res);
			// 		});
			// 	});
			});
		});
	}

	// tryRDFStore();

	var tryRDFStore2 = function(){
		console.log("***** RDFStore *****");
		console.log("**** Create Store ****");
		// http://localhost:8890/imd/rank/crime
		app.rdfstore.create(function(err, store) {
			// store.execute('LOAD <http://dbpedia.org/resource/Tim_Berners-Lee> INTO GRAPH <http://example.org/people>', function() {
			// 	store.execute('SELECT ?s { GRAPH <http://example.org/people> { ?s ?p ?o } }', function(err, results) {
   //               	console.log(results.length);
   //              });
			// });
			store.execute('LOAD <http://localhost:8890/imd/rank/crime> INTO GRAPH <http://example.org/people>', function(err) {
				console.log("loaded: ", err);
				store.execute('SELECT ?s { GRAPH <http://example.org/people> { ?s ?p ?o } }', function(err, results) {
                 	console.log(results.length);
                });
			});
		});	
	}

	// tryRDFStore2();

	var boo = function(){
		new Store({name:'test', overwrite:true}, function(err,store){
		    store.execute('INSERT DATA {  <http://example/person1> <http://xmlns.com/foaf/0.1/name> "Celia" }', function(err){

		       store.registerDefaultProfileNamespaces();
				// simple query execution
				// console.log(store.registerDefaultProfileNamespaces());
				// var n3Parser = store.registerParser("text/n3", n3Parser);
		       store.execute('SELECT * { ?s foaf:name ?name }', function(err,results) {
		       	console.log(results);
		       });
		    });
		    store.close();
		});
	}
	// boo();

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
	checkJSON();
}