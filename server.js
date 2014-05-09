'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	Q 			= require('q'),
	Knex 		= require('knex'),
	_ 			= require('lodash'),
	cons        = require('consolidate'),
	templates   = require('./templates');

var Company = require('./CompanyProvider');

var STATES = {'TX': 'Texas','FL': 'Florida','NM': 'New Mexico','CA': 'California','AZ': 'Arizona'};


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
	app.use('/favicon.ico/',express.static(__dirname+'/favicon.ico'));

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
		var matches = req.url.match(/^\/(es\/)?([a-z\-]{3,})$/i); // "/es/non-state-string"
		var is_spanish = (matches && typeof(matches[1]) !== 'undefined')?true:false;
		var template_data = {};
		var template = is_spanish?templates.spanish:templates.english;

		template_data.url_path = is_spanish?'http://'+req.host+'/es/':'http://'+req.host+'/';
		template_data.encoded_url = encodeURIComponent(req.originalUrl);

		var page = 'home';
		var resultPromise = Q.fcall(function(){
			return page;
		});
		//if specifies words only after the first /
		if (matches && typeof(matches[2]) !== 'undefined'){
			console.log('company page');
			//company page
			var company_id = matches[2];
			resultPromise = Company.prototype.findById(company_id
			).then(function(data){
				if (data){
					template_data = _.merge(
						template_data,	//sets general variables
						data,	//sets company variables
						{twitter_share_text: encodeURIComponent(template.twitter_company_share)}
						);
					page = 'index';
					console.log('found data');
				}
				return page;
			});
		//if at least has state in it
		}else if ((matches = req.url.match(/^\/(es\/)?([a-z]{2,2})\/?([a-z\-]{3,})?\/?([a-z\-]{3,})?/i)) && typeof(matches[2]) !== 'undefined'){
			console.log('directory page');
			var state = STATES[matches[2].toUpperCase()];
			var county = (typeof(matches[3]) !== 'undefined')?matches[3]:null;
			var city = (typeof(matches[4]) !== 'undefined')?matches[4]:null;
			resultPromise = Company.prototype.findByRegion(matches[2],matches[3],matches[4]).then(function(data){
				
				if (data){
					var breadcrumb = [state];
					if (county){
						breadcrumb.push(county);
						if (city){
							breadcrumb.push(city);
						}
					}
					template_data = _.merge(
						template_data,
						data,
						{
							breadcrumb: breadcrumb
						}
					);
					page = 'directory';
				}
				return page;
			});
			//home/directory page
			/*Company.prototype.findByState
			Company.prototype.findByCity
			Company.prototype.findByCounty*/
		}else if (typeof(req.query.q) !== 'undefined'){
			//search page
			console.log('search page');
			page = 'searchresults';
		}
		resultPromise.then(function(mypage){
			console.log('rendering page: '+mypage);
			if (mypage === 'home' && typeof(template_data.breadcrumb) === 'undefined'){
				template_data.breadcrumb = ['Texas'];
			}
			console.log(template_data);
			res.render((is_spanish)?mypage+'-es':mypage, template_data);
		}).catch(function (error) {
			console.log(error);
		}).done();
		/*}else{
			res.send(200,'<h2>Service Temporarily Unavailable</h2><div>The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</div>');
		}*/
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

startServer();