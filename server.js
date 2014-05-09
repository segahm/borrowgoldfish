'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	Knex = require('knex'),
	_ = require('lodash'),
	cons = require('consolidate');

var Company = require('./CompanyProvider');

var STATES = {};


Knex.knex = Knex.initialize({
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    user: 'postgres',
    password: 'kristina',
    //user     : 'caura',
    //password : '46uxrEb3ZExf',
    database : 'goldfish',
    charset  : 'utf8',
    port: 5432   //3306 - mysql
  }
});

/*var knex = require('knex').knex;
function test(res){
	console.log(res);
}
knex('companies').select().exec(test);*/
//  configLoader  = require('./core/config-loader.js'),
 // errors        = require('./core/error-handling');

// If no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function startServer() {
	var app = express();
	app.engine('html', cons.templayed);
	// set .html as the default extension 
	app.set('view engine', 'html');
	app.set('views', __dirname);

	//ignore static file requests
	app.use('/index_files',express.static(__dirname+'/index_files'));
	app.use('/static',express.static(__dirname+'/static'));
	app.use('/favicon.ico',express.static(__dirname+'/favicon.ico'));

	app.use(express.bodyParser());
	app.configure('development', function(){
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function(){
	  app.use(express.errorHandler());
	});

	//var companyProvider = new CompanyProvider();


	app.use(function(req, res, next){
		console.log('%s %s', req.method, req.url);
		res.set('Content-Type', 'text/html');
		//spanish
		var matches = req.url.match(/^\/(es\/)?([a-z\-]{3,})$/i);
		var is_spanish = (matches && typeof(matches[1]) !== 'undefined')?true:false;
		var resultPromise = Q.fcall(function(){
		});
		var data = {};
		var page = null;
		if (matches && typeof(matches[2]) !== 'undefined'){
			console.log('company page');
			//company page
			var company_id = matches[2];
			var company = new Company();

			company.findById(company_id
			).then(function(data){
				if (data){
					data = _.merge(
						data,
						{
						encoded_url: '',
						url_path:'',	// http://borrowgoldfish.com/es/ or http://borrowgoldfish.com/
						twitter_share_text: 'I%20might%20be%20running%20a%20%23smallbiz%2C%20but%20the%20numbers%20speak%20for%20themselves'
					});
				}else{
					page = 'home';
				}
			}).catch(function (error) {
			    console.log(error);
			}).done();
		}else if ((matches = req.url.match(/^\/(es\/)?([a-z]{2,2})/i)) && typeof(matches[2]) !== 'undefined' && typeof(STATES[matches[2]]) !== 'undefined'){
			displayHomepage(req,res,is_spanish);
		}else if (typeof(req.query.q) !== 'undefined'){
			//search page
			console.log('search page');
			page = 'searchresults';
		}
		if (page){
			resultPromise.then(function(){
				res.render((is_spanish)?page+'-es':page, data);
			})
		}else{
			res.send(200,'<h2>Service Temporarily Unavailable</h2><div>The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</div>');
		}
	});
	app.listen(17912);
  /*http.createServer(function(request, response) {
	  response.writeHead(200, {'Content-Type': 'text/html'});
	  response.write('<h2>Service Temporarily Unavailable</h2><div>The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</div>');
	  response.end();
	}).listen(17912);*/
}

/*if (cluster.isMaster && !process.env.NO_CLUSTER) {
  // Create workers for each cpu
  var cpuCount = require('os').cpus().length;
  for (var i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker) {
    console.log('Worker ' + worker.id + ' died. Respawning');
    cluster.fork();
  });
} else {
  startServer();
}*/

function loadStates(){
	var STATES_ARRAY = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
	for (var i=0;i<STATES_ARRAY.length;i++){
		STATES[STATES_ARRAY[i]] = 1;
	}
}

function displayHomepage(req,res,is_spanish){
	console.log('directory page');
	//home/directory page
	/*Company.prototype.findByState
	Company.prototype.findByCity
	Company.prototype.findByCounty*/
	var data = {};
	res.render((is_spanish)?'home':'home-es', data);
}

loadStates();
startServer();