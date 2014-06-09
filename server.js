'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	Q 			= require('q'),
	Knex 		= require('knex'),
	_ 			= require('lodash'),
	cons        = require('consolidate'),
	errorhandler = require('errorhandler'),
	templates   = require('./templates'),
	seedrandom	= require('seedrandom'),
	cookieParser = require('cookie-parser'),
	sitemap = require('sitemap');

var HOME_PAGE_IDS = require('./sample_ids');
var HOME_PAGE_IDS_LENGTH = Object.keys(HOME_PAGE_IDS).length;
var HOME_PAGE_KEYS = {};
_(HOME_PAGE_IDS).forEach(function(restaurant){
	HOME_PAGE_KEYS[restaurant.id] = restaurant.twitter;
});

// If no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var Company = require('./CompanyProvider');
var Utility = require('./utils');

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

function formatValuation(valuation){
	if (valuation){
		valuation = Math.round(valuation/100)*100;
		valuation = valuation.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
	return valuation;
}

function getRandomRestaurants(howMany){
	var entries = [];
	var old_r = {};
	var new_r = -1;
	var i=0;
	while (i<howMany){
		new_r = Math.round(Math.random()*(HOME_PAGE_IDS_LENGTH-1));
		if (typeof(old_r[new_r]) === 'undefined'){
			entries.push(HOME_PAGE_IDS[new_r]);
			old_r[new_r] = 1;
			i++;
		}
	}
	return entries;
}
function startServer() {
	var app = express();
	

	if (process.env.NODE_ENV === 'production'){
		var forceDomain = require('node-force-domain');
		app.use(forceDomain({
		  hostname: 'www.borrowgoldfish.com',
		  type: 'permanent'
		}));
	}
	app.engine('html', cons.templayed);
	// set .html as the default extension 
	app.set('view engine', 'html');
	app.set('views', __dirname);

	//ignore static file requests
	app.use('/static',express.static(__dirname+'/static'));
	app.use('/favicon.ico',express.static(__dirname+'/static/favicon.ico'));
	app.use('/robots.txt',express.static(__dirname+'/static/robots.txt'));

	if (process.env.NODE_ENV === 'development'){
		app.use(errorhandler());
	}
	app.get('/sitemap.xml', function(req, res) {
		Utility.prototype.listPages().then(function(urls){
			var sm = sitemap.createSitemap ({
				hostname: 'http://www.borrowgoldfish.com',
				cacheTime: 600000,        // 6000 sec - cache purge period
				urls: urls
			});
			sm.toXML( function (xml) {
				res.header('Content-Type', 'application/xml');
				res.send( xml );
			});
		});
	});

	app.use(cookieParser());

	app.use(function(req, res, next){
		res.set('Content-Type', 'text/html');
		if (process.env.NODE_ENV === 'development'){
			console.log(req.url);
		}
		var user_id;
		//user identification piece
		if (typeof(req.cookies.user) !== 'undefined'){
			user_id = req.cookies.user;
		}else{
			user_id = Utility.prototype.hashCode(Math.random()+'');
			//set a new cookie
			res.cookie('user', user_id, { maxAge: 172800000});
		}
		//user-specific random
		var rng = seedrandom(user_id,{ global: false });
		var A_B_Split = Math.round(rng());
		
		//spanish
		var matches = req.path.match(/^\/(es)/i);
		var is_spanish = ((matches && (req.path.length > 3 && req.path[3] === '/')) || (typeof(req.query.fb_locale) !== 'undefined' && req.query.fb_locale === 'es_ES'))?true:false;

		matches = req.path.match(/^\/(es\/)?([a-z0-9\-]{3,})\/?$/i); // "/es/non-state-string"
		var template_data = {};
		//temporary settings template => rewrite this later
		if (process.env.NODE_ENV === 'development'){
			template_data.settings = templates.dev;
		}else if (process.env.NODE_ENV === 'production'){
			template_data.settings = templates.production;
		}
		var template = is_spanish?templates.spanish:templates.english;
		template_data.es = is_spanish;	//whether to turn-on spanish language

		template_data.is_a = (A_B_Split === 0)?true:false;
		template_data.is_b = (A_B_Split === 1)?true:false;

		template_data.url_path = is_spanish?'http://'+req.host+'/es/':'http://'+req.host+'/';
		template_data.encoded_url = encodeURIComponent(
			'http://'+req.host+req.originalUrl);
		template_data.url = req.path.replace(/^\/es\//i,'/').replace(/^\/es$/i,'/');
		template_data.full_url = (is_spanish?'http://'+req.host+'/es':'http://'+req.host)+req.url.replace(/^\/es\//i,'/').replace(/^\/es$/i,'/');

		var page = 'index';	//default page
		var resultPromise = Q.fcall(function(){ return page;});

		var dir_match = req.path.match(/^\/(es\/)?([a-z]{2,2})\/?(\/[a-z_\-]{3,})?\/?(\/[a-z_\-]{3,})?\/?$/i);
		/**
		 *FIRST-pass page check
		 */
		 //COMPANY
		if (matches && typeof(matches[2]) !== 'undefined'){
			var company_id = matches[2];
			resultPromise = companyPage(template_data,company_id,template);
		//DIRECTORY
		}else if (dir_match && typeof(dir_match[2]) !== 'undefined' && dir_match[2].toLowerCase() !== 'es'){
			var region = {
				state_abrev: dir_match[2].toUpperCase(),
				county: (dir_match && typeof(dir_match[3]) !== 'undefined')?toTitleCase(dir_match[3].slice(1)):null,
				city: (dir_match && typeof(dir_match[4]) !== 'undefined')?toTitleCase(dir_match[4].slice(1)):null
			};
			region.state = STATES[region.state_abrev];
			resultPromise = directoryPage(region,template_data,dir_match,template);
		}else if (typeof(req.query.q) !== 'undefined'){
			console.log('query');
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
			//console.log(template_data);
			if (mypage === '404'){
				res = res.status(404);
				console.log('%s %s', req.method, req.url);
				mypage = 'index';	//404 alias
			}
			var page_template;
			switch(mypage){
			case 'index':
				page_template = template.page.index;
				break;
			case 'directory':
				page_template = template.page.directory;
				break;
			case 'company':
				page_template = template.page.company;
				break;
			}
			template_data = _.merge(
				template_data,
				page_template,
				template.all_pages
			);


			res.render(mypage, template_data);
		}).catch(function (error) {
			if (process.env.NODE_ENV === 'development'){
				res.send(500, error.message);
			}else{
				res.send(500,'<h2>An error has occured</h2><div>The server is temporarily unable to service your request. The issue has been reported and we are likely resolving it already. Please try again later.</div>');
			}
			console.log('%s %s', req.method, req.url);
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


companyPage = function(template_data,company_id,template){
	var page;
	return Company.prototype.findById(company_id
	).then(function(data){
		var regional_info = null;
		if (data){
			data.company.valuation = formatValuation(data.company.valuation);
			//similar companies:
			var writeUp = new Writeup();
			var bitmap = writeUp.write(data.similar,data.company);
			template_data.description_short_text = template.shortDescription(data.company.title,data.company.valuation,data.company.county);
			template_data = _.merge(
				template_data,	//sets general variables
				data.company,	//sets company variables
				{
					encoded_title: encodeURIComponent(data.company.title),
					encoded_description_short_text: encodeURIComponent(template_data.description_short_text),
					twitter_company_specific_text: template.twitter(data.company.title,data.company.valuation,data.company.county)
				},
				bitmap
			);
			if (!data.company.address){
				template_data.show_map = false;
				data.company.address = '';
			}else{
				template_data.encodedAddress = encodeURIComponent(data.company.address+','+data.company.city+','+data.company.state+',USA');
			}
			page = 'company';
			regional_info = {state: data.company.state,
					county: data.company.county,
					category: data.company.category};
			//temporary hack to show twitter handles for some businesses
			if (typeof(HOME_PAGE_KEYS[company_id]) !== 'undefined'){
				var twitter_handle = HOME_PAGE_KEYS[company_id];
				template_data.twitter_company_specific_text = template.twitter(data.company.title,data.company.valuation,data.company.county,twitter_handle);
			}
			template_data.unencoded_twitter_company_specific_text = template_data.twitter_company_specific_text;
			
			template_data.twitter_company_specific_text = encodeURIComponent(template_data.twitter_company_specific_text);
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
					categories: Object.keys(data.top_cats),
					//sort compared counties, keeping the page's county first
					counties: Object.keys(data.top_counties).reduce(function(p,c,i,ar){
						if (ar[i] !== p[0]){
							p.push(ar[i]);
						}
						return p;
					},[template_data.county]),
					svg: JSON.stringify(data),
					total_restaurants: data.total_restaurants
				});
			template_data.json_counties = JSON.stringify(template_data.counties);
		}
		return page;
	});
};
homePage = function(req,template_data){
	var page = 'index';
	var showcaseRestaurants = getRandomRestaurants(3);
	//make sure the restaurant with the longest name is the first one
	showcaseRestaurants.sort(function(a,b){
		return b.name.length - a.name.length;
	});
	template_data.showcaseRestaurants = showcaseRestaurants;
	return Q.fcall(function(){ return page;});
};
directoryPage = function(region,template_data,dir_match,template){
	//guard against bad states by showing default directory page, rather than no results
	/*if (typeof(STATES[state_abrev]) === 'undefined'){
		state = STATES.TX;
		county = null;
		city = null;
	}*/
	var breadcrumb = [{name: region.state}];
	var url_path = template_data.es?['es',region.state_abrev]:[region.state_abrev];
	return Company.prototype.findByRegion(region.state_abrev,region.county,region.city)
	.then(function(data){
		var page = '404';	//if bad/non-existent category
		if (data){
			//NAVBAR and REGIONAL INFO
			if (region.county){
				breadcrumb.push({name: region.county});
				url_path.push(region.county);
				template_data.region = template.cities_home;
				if (region.city){
					breadcrumb.push({name: region.city});
					url_path.push(region.city);
					template_data.region = template.restaurants;
					template_data.show_other_states = false;
				}
			}else{
				template_data.region = template.counties_home;
			}
			//Parse links for non-city listings
			_(data.items).forIn(function(v,k){
				data.items[k].url = ('/'+url_path.join('/')+'/'+v.title).toLowerCase().replace(/[ ]/g,'_');
			});
			//FOR CITY-SPECIFIC pages, print companies
			_(data.companies).forIn(function(v,k){
				data.companies[k].url = (template_data.es?'/es/':'/')+v.company_id;
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
				breadcrumb[i].url = (template_data.es?'/es/':'/')+dir_match.slice(2,3+i).join('');
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

/*function exitHandler(options, err) {
	if (options.cleanup){
		cluster.disconnect(exitHandler.bind(null, {exit:true}))
	}
	if (err){
		console.log(err.stack);
	}
	if (options.exit){
		process.exit();
	}
}*/



var workes = 0;
/*if (process.env.NODE_ENV === 'production') {
	// Create workers for each cpu
	if (cluster.isMaster && !process.env.NO_CLUSTER){
		console.log('is master');
		//handle graceful exiting
		// process.stdin.resume();//so the program will not close instantly
		// process.on('exit', exitHandler.bind(null,{cleanup:true}));
		// process.on('uncaughtException', exitHandler.bind(null, {cleanup:true}));
		// process.on('SIGINT', exitHandler.bind(null, {cleanup:true}));

		var cpuCount = require('os').cpus().length;
		for (var i = 0; i < cpuCount; i++) {
			console.log('cluster process');
			cluster.fork();
			workes++;
		}

		cluster.on('exit', function(worker) {
			console.log('Worker ' + worker.id + ' died. Respawning');
			if (workes < 100){
				cluster.fork();
				workes++;
			}else{
				console.log('something is wrong: too many workers');
			}
		});
	}else{
		console.log('starting worker');
		startServer();
	}
} else {*/
	startServer();
//}