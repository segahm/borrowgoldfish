'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	Knex = require('knex'),
	cons = require('consolidate');

var CompanyProvider = require('./CompanyProvider');

Knex.knex = Knex.initialize({
  client: 'pg',
  connection: {
    host     : '127.0.0.1',
    user     : 'caura',
    password : '46uxrEb3ZExf',
    database : 'goldfish',
    charset  : 'utf8',
    port: 5432   //3306 - mysql
  }
});

var knex = require('knex').knex;
function test(res){
	console.log(res);
}
knex('companies').select().exec(test);
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
		if (req.url.match(/^\/(es\/)?([a-z\-]+)$/)){
			res.render('index', {
				title: 'My Texas Restaurant'
			});
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
startServer();
