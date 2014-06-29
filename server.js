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
	sitemap = require('sitemap'),
	twitterAPI = require('node-twitter-api'),
	favicon = require('serve-favicon'),
	sendgrid  = require('sendgrid')('caura', '4JNKQVXpc7NfyN');

// If no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var Company = require('./CompanyProvider');
var Utility = require('./utils');

var Writeup = require('./writeup');

var STATES = {'TX': 'Texas','FL': 'Florida','NM': 'New Mexico','CA': 'California','AZ': 'Arizona'};

//define page function
var directoryPage,
	homePage,
	companyPage,
	tra,
	submitData;
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

var paths = ['submit','search'];

//  configLoader  = require('./core/config-loader.js'),
 // errors        = require('./core/error-handling');

function startServer() {
	var app = express();
	/*var twitter = new twitterAPI({
		consumerKey: 'xbZMI7NtccoXTmIe3MQA',
		consumerSecret: 'lD04vbN5YpyMWMmFX1uZja4nBVFTNAuwKPEoXu0KuSg',
		callback: 'http://www.caura.co/'
	});*/

	if (process.env.NODE_ENV === 'production'){
		app.all(/.*/, function(req, res, next) {
			var host = req.header('host');
			//if (host.match(/^www\..*/i)) {
			if (host.match(/^www\.caura.co/i)) {
				next();
			} else {
				//res.redirect(301, 'http://www.' + host+req.url);
				res.redirect(301, 'http://www.caura.co'+req.url);
			}
		});
	}
	app.engine('html', cons.templayed);
	// set .html as the default extension 
	app.set('view engine', 'html');
	app.set('views', __dirname);

	//ignore static file requests
	app.use('/static',express.static(__dirname+'/static'));
	app.use(favicon(__dirname + '/static/favicon.ico'));
	app.use('/robots.txt',express.static(__dirname+'/static/robots.txt'));

	if (process.env.NODE_ENV === 'development'){
		app.use(errorhandler());
	}
	app.get('/sitemap.xml', function(req, res) {
		Utility.prototype.listPages().then(function(urls){
			var sm = sitemap.createSitemap ({
				hostname: 'http://www.caura.co',
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
		var is_home_page_test = false;
		res.set('Content-Type', 'text/html');
		var path = req.path;
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
		if (typeof(req.cookies.say_hello) !== 'undefined'){
			is_home_page_test = Boolean(req.cookies.say_hello === 'true');
		}else if (path.match(/\/(say-hello)/)){
			path = path.replace('/say-hello','');
			if (typeof(req.query.f) === 'undefined'){
				is_home_page_test = (Math.round(rng()) === 1)?true:false;
			}else{
				//force new_home_page
				is_home_page_test = true;
			}
			res.cookie('say_hello', (is_home_page_test+''), { maxAge: 172800000});
		}
		
		//spanish
		var matches = path.match(/^\/(es)/i);
		var is_spanish = ((matches && (path.length > 3 && path[3] === '/')) || (typeof(req.query.fb_locale) !== 'undefined' && req.query.fb_locale === 'es_ES'))?true:false;

		matches = path.match(/^\/(es\/)?([a-z0-9\-]{3,})\/?$/i); // "/es/non-state-string"
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
		template_data.url = path.replace(/^\/es\//i,'/').replace(/^\/es$/i,'/');
		template_data.full_url = (is_spanish?'http://'+req.host+'/es':'http://'+req.host)+req.url.replace(/^\/es\//i,'/').replace(/^\/es$/i,'/');

		var page = 'index';	//default page
		var resultPromise = Q.fcall(function(){ return page;});

		var dir_match = path.match(/^\/(es\/)?([a-z]{2,2})\/?(\/[a-z_\-]{3,})?\/?(\/[a-z_\-]{3,})?\/?$/i);
		var path_match = new RegExp('^\/(es\/)?('+paths.join('|')+')\/?$','i').exec(path);
		/**
		 *FIRST-pass page check
		 */
		 //COMPANY
		 //temporary Texas event
		var tra_matches = path.match(/^\/tra\/([0-9]{10,})?/i);
		if (tra_matches){
			var hashcode = (typeof(tra_matches[1]) !== 'undefined')?tra_matches[1]:null;
			resultPromise = tra(template_data,hashcode);
		}else if (path_match && typeof(path_match[2]) !== 'undefined' && path_match[2].toLowerCase() !== 'es'){
			switch(path_match[2]){
			case 'submit':
				resultPromise = submitData(req,res);
			}
		}else if (matches && typeof(matches[2]) !== 'undefined'){
			var company_id = matches[2];
			resultPromise = companyPage(template_data,company_id,template);
		//DIRECTORY
		}else if (dir_match && typeof(dir_match[2]) !== 'undefined' && dir_match[2].toLowerCase() !== 'es'){
			var region = {
				state_abrev: dir_match[2].toUpperCase(),
				county: (dir_match && typeof(dir_match[3]) !== 'undefined')?Utility.prototype.toTitleCase(dir_match[3].slice(1)):null,
				city: (dir_match && typeof(dir_match[4]) !== 'undefined')?Utility.prototype.toTitleCase(dir_match[4].slice(1)):null
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
				return homePage(req,template_data,template
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
				if (is_home_page_test === true){
					mypage = 'alternative_home';
				}
				//keep the same template for both variations of a home page
				page_template = template.page.index;
				break;
			case 'directory':
				page_template = template.page.directory;
				mypage = 'index';
				break;
			case 'company':
				page_template = template.page.company;
				break;
			}
			template_data = _.merge(
				{},
				template.all_pages,
				page_template,
				template_data
			);
			if (mypage !== 'api'){
				res.render(mypage, template_data);
			}
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

submitData = function(req,res){
	var email = new sendgrid.Email({
		toname:   ['Business Name'],
		from:     'grow@caura.co',
		fromname: 'Caura',
		subject:  'Testing Submit',
		text:     'Testing Submit - Body'
	});
	email.addTo('smeer@nes.ru');
	return Q.ninvoke(sendgrid, 'send', email)
	.then(function(json) {
		if (json.message && json.message === 'success') {
			res.json({status: 'OK'});
		}else{
			res.json({status: 'ERROR'});
			console.log(json);
		}
		return 'api';
	});
};

tra = function(template_data,hashcode){
	var page = 'tra-texas-restaurant-marketplace';
	return Q.fcall(function(){
		if (hashcode){
			template_data.offer = Utility.prototype.listOffer(hashcode);
		}else{
			template_data.offers = Utility.prototype.listOfferings();
		}
		return page;
	});
};
companyPage = function(template_data,company_id,template){
	var page;
	return Company.prototype.findById(company_id
	).then(function(data){
		var regional_info = null;
		if (data){
			data.company.valuation = Utility.prototype.formatValuation(data.company.valuation);
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
			if (typeof(Utility.prototype.HOME_PAGE_KEYS[company_id]) !== 'undefined'){
				var twitter_handle = Utility.prototype.HOME_PAGE_KEYS[company_id];
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
homePage = function(req,template_data,template){
	var page = 'index';
	return Q.fcall(function(){
		if (typeof(req.query.page) !== 'undefined'){
			if (req.query.page === 'about'){
				template_data = _.merge(template_data,template.page.about);
				template_data.is_about = true;
			}else if(req.query.page === 'privacy'){
				template_data = _.merge(template_data,template.page.privacy);
				template_data.is_privacy = true;
			}
			return page;
		}else{
			template_data.is_index = true;
			var showcaseRestaurants = Utility.prototype.getRandomRestaurants(3);
			//make sure the restaurant with the longest name is the first one
			showcaseRestaurants.sort(function(a,b){
				return b.name.length - a.name.length;
			});
			var ids = [];
			_(showcaseRestaurants).forEach(function(val){
				ids.push(val.id);
			});
			return Company.prototype.findByIds(ids).then(function(data){
				_(showcaseRestaurants).forIn(function(val,k){
					var id = showcaseRestaurants[k].id;
					showcaseRestaurants[k] = _.merge(data[id],showcaseRestaurants[k]);
					showcaseRestaurants[k].value = Utility.prototype.formatValuation(data[id].valuation);
					//showcaseRestaurants[k].desc = 'fdsfds';
				});
				template_data.showcaseRestaurants = showcaseRestaurants;
				return page;
			});
		}
	});
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
			template_data.title_region = Utility.prototype.join(breadcrumb,'name',', ');
			template_data.show_other_states = true;

			//links for NAVBAR
			for (var i=0;i<breadcrumb.length-1;i++){
				breadcrumb[i].category = true;
				breadcrumb[i].url = (template_data.es?'/es/':'/')+dir_match.slice(2,3+i).join('');
			}
			breadcrumb[breadcrumb.length-1].last = true;

			_.merge(
				template_data,{
					breadcrumb: breadcrumb,
					other_states: other_states
				},
				data,
				{is_directory: true});
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