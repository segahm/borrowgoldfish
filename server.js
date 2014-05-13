'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	Q 			= require('q'),
	Knex 		= require('knex'),
	_ 			= require('lodash'),
	cons        = require('consolidate'),
	templates   = require('./templates');

var Company = require('./CompanyProvider');

var Writeup = require('./writeup');

var STATES = {'TX': 'Texas','FL': 'Florida','NM': 'New Mexico','CA': 'California','AZ': 'Arizona'};

//define page function
var directoryPage,
	homePage,
	companyPage;

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
//  configLoader  = require('./core/config-loader.js'),
 // errors        = require('./core/error-handling');

// If no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function toTitleCase(str){
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace(/_/g,' ');
}
function join(array,key,with_el){
	var str = '';
	_(array).forEachRight(function(v){
		str += v[key]+with_el;
	});
	return str.slice(0,str.length-with_el.length);
}

function startServer() {
	var app = express();
	app.engine('html', cons.templayed);
	// set .html as the default extension 
	app.set('view engine', 'html');
	app.set('views', __dirname);

	//ignore static file requests
	app.use('/index_files',express.static(__dirname+'/index_files'));
	app.use('/static',express.static(__dirname+'/index_files'));
	app.use('/favicon.ico',express.static(__dirname+'/index_files/favicon.ico'));
	app.use('/favicon.ico/',express.static(__dirname+'/index_files/favicon.ico'));

	app.use(express.bodyParser());
	app.configure('development', function(){
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

/*	app.configure('production', function(){
	  app.use(express.errorHandler());
	});*/

	//var companyProvider = new CompanyProvider();


	app.use(function(req, res, next){
		console.log('%s %s', req.method, req.url);
		res.set('Content-Type', 'text/html');
		//spanish
		var matches = req.url.match(/^\/(es\/)?([a-z0-9\-]{3,})$/i); // "/es/non-state-string"
		var is_spanish = (matches && typeof(matches[1]) !== 'undefined')?true:false;
		var template_data = {};
		var template = is_spanish?templates.spanish:templates.english;
		template_data.es = is_spanish;	//whether to turn-on spanish language

		template_data.url_path = is_spanish?'http://'+req.host+'/es/':'http://'+req.host+'/';
		template_data.encoded_url = encodeURIComponent(req.originalUrl);

		var page = 'home';	//default page
		var resultPromise = Q.fcall(function(){ return page;});

		var dir_match = req.url.match(/^\/(es\/)?([a-z]{2,2})\/?(\/[a-z_\-]{3,})?\/?(\/[a-z_\-]{3,})?$/i);
		/**
		 *FIRST-pass page check
		 */
		 //COMPANY
		if (matches && typeof(matches[2]) !== 'undefined'){
			console.log('company page');
			var company_id = matches[2];
			resultPromise = companyPage(template_data,company_id,template);
		//DIRECTORY
		}else if (dir_match && typeof(dir_match[2]) !== 'undefined'){
			console.log('directory page');
			var region = {
				state_abrev: dir_match[2].toUpperCase(),
				county: (dir_match && typeof(dir_match[3]) !== 'undefined')?toTitleCase(dir_match[3].slice(1)):null,
				city: (dir_match && typeof(dir_match[4]) !== 'undefined')?toTitleCase(dir_match[4].slice(1)):null
			};
			region.state = STATES[region.state_abrev];
			resultPromise = directoryPage(region,template_data,dir_match);
		}else if (typeof(req.query.q) !== 'undefined'){
			page = '404';
		}

		/**
		 * SECOND-pass page check
		 */

		resultPromise.then(function(mypage){
			console.log(2);
			console.log('second-pass:'+mypage);
			//either default or no records, forcing to show a HOME page
			if (mypage === 'home' || mypage === '404'){
				return homePage(req,template_data
					).then(function(status){
						//make sure to send the original status if successfully executed
						return (status !== 'home')?status:mypage;
					});
			}else{
				return mypage;	//skip homepage process altogethere
			}
		}).then(function(mypage){
			console.log('result');
			console.log('rendering page: '+mypage);
			console.log(template_data);
			if (mypage === '404'){
				console.log('404');
				res = res.status(404);
				mypage = 'home';	//404 alias
			}
			res.render(mypage, template_data);
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

companyPage = function(template_data,company_id,template){
	var page;
	return Company.prototype.findById(company_id
	).then(function(data){
		var regional_info = null;
		if (data && data.length){
			//similar companies:
			var writeUp = new Writeup();
			var bitmap = writeUp.write(data.similar,data.company);
			template_data = _.merge(
				template_data,	//sets general variables
				data.company,	//sets company variables
				{
					twitter_share_text: encodeURIComponent(template.twitter_company_share),
				},
				bitmap
			);
			page = 'index';
			console.log('found data');
			regional_info = {state: data.company.state,
					county: data.company.county,
					category: data.company.category};
		}else{
			page = '404';
		}
		return regional_info;
	}).then(function(v){
		return v?Company.prototype.regionalStats(v.state,v.county,v.category):null;
	}).then(function(data){
		//append regional stats about this company:
		if (data){

		}
		return page;
	});

	/*.then(function(v){
		//stats about this company:
		return Company.prototype.regionalStats(v.state,v.county,v.category);
	})
*/
};
homePage = function(req,template_data){
	var page = 'home';
	return Q.fcall(function(){ return page;});
};
directoryPage = function(region,template_data,dir_match){
	//guard against bad states by showing default directory page, rather than no results
	/*if (typeof(STATES[state_abrev]) === 'undefined'){
		state = STATES.TX;
		county = null;
		city = null;
	}*/
	var breadcrumb = [{name: region.state}];
	var url_path = [region.state_abrev];
	return Company.prototype.findByRegion(region.state_abrev,region.county,region.city)
	.then(function(data){
		var page = '404';	//if bad/non-existent category
		if (data){
			//NAVBAR and REGIONAL INFO
			if (region.county){
				breadcrumb.push({name: region.county});
				url_path.push(region.county);
				template_data.region = 'Restaurants, Cities';
				if (region.city){
					breadcrumb.push({name: region.city});
					url_path.push(region.city);
					template_data.region = 'Restaurants';
					template_data.show_other_states = false;
				}
			}else{
				template_data.region = 'Restaurants, Counties';
			}
			//Parse links for non-city listings
			_(data.items).forIn(function(v,k){
				data.items[k].url = ('/'+url_path.join('/')+'/'+v.title).toLowerCase().replace(/[ ]/g,'_');
			});
			//FOR CITY-SPECIFIC pages, print companies
			_(data.companies).forIn(function(v,k){
				data.companies[k].url = '/'+v.company_id;
			});
			//CATEGORY LINKS TO OTHER STATES
			var other_states = [];
			_(STATES).forIn(function(name,abbr){
				if (abbr !== region.state_abrev){
					other_states.push({
						name: name,
						abbr: abbr
					});
				}
			});
			template_data.title_region = join(breadcrumb,'name',', ');
			template_data.show_other_states = true;

			//links for NAVBAR
			for (var i=0;i<breadcrumb.length-1;i++){
				breadcrumb[i].category = true;
				breadcrumb[i].url = '/'+dir_match.slice(2,3+i).join('');
			}
			breadcrumb[breadcrumb.length-1].last = true;

			template_data = _.merge(
				template_data,{
					breadcrumb: breadcrumb,
					other_states: other_states
				},
				data
			);
			page = 'directory';
		}
		return page;
	});
};
startServer();