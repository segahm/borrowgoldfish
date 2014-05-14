'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	Q 			= require('q'),
	Knex 		= require('knex'),
	_ 			= require('lodash'),
	cons        = require('consolidate'),
	errorhandler = require('errorhandler'),
	templates   = require('./templates');

// If no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var Company = require('./CompanyProvider');

var Writeup = require('./writeup');

var STATES = {'TX': 'Texas','FL': 'Florida','NM': 'New Mexico','CA': 'California','AZ': 'Arizona'};

//define page function
var directoryPage,
	homePage,
	companyPage;
var knex_connection = {
	host     : '127.0.0.1',
	database : 'goldfish',
	charset  : 'utf8',
	port: 5432   //3306 - mysql
};

if (process.env.NODE_ENV === 'development'){
	knex_connection.user ='postgres';
	knex_connection.password = 'kristina';
	
}else if (process.env.NODE_ENV === 'production'){
	knex_connection.user ='caura';
	knex_connection.password = '46uxrEb3ZExf';
}

Knex.knex = Knex.initialize({
	client: 'pg',
	connection: knex_connection
});


//  configLoader  = require('./core/config-loader.js'),
 // errors        = require('./core/error-handling');

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


	if (process.env.NODE_ENV === 'development'){
		app.use(errorhandler());
	}


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
		template_data.encoded_url = encodeURIComponent(
			'http://'+req.host+(is_spanish?'/es':'')+req.originalUrl);


		var page = 'index';	//default page
		var resultPromise = Q.fcall(function(){ return page;});

		var dir_match = req.url.match(/^\/(es\/)?([a-z]{2,2})\/?(\/[a-z_\-]{3,})?\/?(\/[a-z_\-]{3,})?$/i);
		/**
		 *FIRST-pass page check
		 */
		 //COMPANY
		if (matches && typeof(matches[2]) !== 'undefined'){
			var company_id = matches[2];
			resultPromise = companyPage(template_data,company_id,template);
		//DIRECTORY
		}else if (dir_match && typeof(dir_match[2]) !== 'undefined'){
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
			//either default or no records, forcing to show a HOME page
			if (mypage === 'index' || mypage === '404'){
				return homePage(req,template_data
					).then(function(status){
						//make sure to send the original status if successfully executed
						return (status !== 'index')?status:mypage;
					});
			}else{
				return mypage;	//skip homepage process altogethere
			}
		}).then(function(mypage){
			console.log('rendering page: '+mypage);
			console.log(template_data);
			if (mypage === '404'){
				res = res.status(404);
				mypage = 'index';	//404 alias
			}
			res.render(mypage, template_data);
		}).catch(function (error) {
			if (process.env.NODE_ENV === 'development'){
				res.send(500, error);
			}
			console.log(error);
			throw error;
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


companyPage = function(template_data,company_id,template){
	var page;
	return Company.prototype.findById(company_id
	).then(function(data){
		var regional_info = null;
		if (data){
			//similar companies:
			var writeUp = new Writeup();
			var bitmap = writeUp.write(data.similar,data.company);
			template_data.description_short_text = 'hello change this description_short_text';
			template_data = _.merge(
				template_data,	//sets general variables
				data.company,	//sets company variables
				{
					twitter_share_text: encodeURIComponent(template.twitter_company_share),
					encoded_title: encodeURIComponent(data.company.title),
					encoded_description_short_text: encodeURIComponent(template_data.description_short_text)
				},
				bitmap
			);
			page = 'company';
			regional_info = {state: data.company.state,
					county: data.company.county,
					category: data.company.category};
		}else{
			page = '404';
		}
		return regional_info;
	}).then(function(v){
		//return {top_counties: [{density: , people: ,catDensity: [category: , count: ]}],top_cats:}
		return v?Company.prototype.regionalStats(v.state,v.county,v.category):null;
	}).then(function(data){
		//append regional stats about this company:
		if (data){
			template_data = _.merge(
				template_data,
				{
					svg: JSON.stringify(data) 
				});
			//handle counties
		}
		return page;
	});
};
homePage = function(req,template_data){
	var page = 'index';
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
if (process.env.NODE_ENV === 'production' && cluster.isMaster && !process.env.NO_CLUSTER) {
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
}