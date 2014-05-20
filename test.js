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


function startServer() {
	var app = express();

	app.use(function(req, res, next){
		res.set('Content-Type', 'text/html');
		console.log(req.url);
	});
	app.listen(17900);
  /*http.createServer(function(request, response) {
	  response.writeHead(200, {'Content-Type': 'text/html'});
	  response.write('<h2>Service Temporarily Unavailable</h2><div>The server is temporarily unable to service your request due to maintenance downtime or capacity problems. Please try again later.</div>');
	  response.end();
	}).listen(17912);*/
}


if (process.env.NODE_ENV === 'production') {
	// Create workers for each cpu
	if (cluster.isMaster && !process.env.NO_CLUSTER){
		console.log('is master');
		var cpuCount = require('os').cpus().length;
		for (var i = 0; i < cpuCount; i++) {
			console.log('cluster process');
			cluster.fork();
		}

		cluster.on('exit', function(worker) {
			console.log('Worker ' + worker.id + ' died. Respawning');
			//cluster.fork();
		});
	}else{
		console.log('starting worker');
		startServer();
	}
} else {
	console.log('starting dev mode process');
	startServer();
}