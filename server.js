'use strict';

var express     = require('express'),
	cluster     = require('cluster'),
	cons = require('consolidate');

var CompanyProvider = require('./company');

//  configLoader  = require('./core/config-loader.js'),
 // errors        = require('./core/error-handling');

// If no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function startServer() {
	var app = express();
	app.engine('html', cons.templayed);
	// set .html as the default extension 
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');

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
		if (req.url.match(/^\/(es\/)?([a-z\-]+)$/)){
			res.render('company', {
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
