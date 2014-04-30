'use strict';

var express         = require('express');
var app = express();

GLOBAL.EMAIL_BODY = null;
//ignore static file requests
app.use('/static',express.static(__dirname+'/static'));
app.use('/favicon.ico',express.static(__dirname+'/favicon.ico'));

app.use(express.bodyParser());
var yelp = require('yelp').createClient({
    consumer_key: 'HnrWS3JCE4g4wbaCrVC0wg',
    consumer_secret: 'XQfhrgq1yJoYnJjxFIOlDut-C44',
    token: '6pCeJihtCBUdcLZu9uSm1eRij20a-sYH',
    token_secret: 'FcNRGSLGxAWa-O8JWv4MPFPn0hs'
  });


var total = 0;
var count = 0;
var buffer = [];

//!!!!!!!!!!!!!SET WEB SERVER LISTENER!!!!!!!!!!!!!!!!!!!
app.use(function(req, res){
    function recursive(error,data){
      console.log(typeof(error));
      console.log(typeof(data));
      if (typeof(error) !== 'undefined' && typeof(data) !== 'undefined'){
        console.log(error);
        total = data.total;
        console.log('total:'+total);
        if (data !== null && data.businesses !== null){
          buffer = buffer.concat(data.businesses);
          console.log('businesses:'+ data.businesses.length);
          count += data.businesses.length;
        }
      }
      if (count < total || total === 0){
        console.log(count);
        yelp.search({limit: 20,offset: count, location: 'Zavala County, TX'}, recursive);
      }else{
        res.send(buffer);
      }
    }
    console.log('%s %s', req.method, req.url);
    var action = req.url.match(/\/([a-z]+)/)[1];
    switch(action){
    case 'list':
      recursive();
      break;
    case 'bus':
      var company = req.url.match(/\/[^\/]+\/[^\/]+\/([a-z\-]+)/)[1];
      console.log('company:'+company);
      yelp.business(company, function(error, data) {
        console.log(error);
        res.send(data);
        console.log(data);
      });
    }
    // See http://www.yelp.com/developers/documentation/v2/search_api
    /*

Maverick County, TX
Zavala County, TX
Starr County, TX
Webb County, TX
Hidalgo County, TX
Zapata County, TX

*/
  });

var port = 8888;
if (typeof process.env.PORT !== 'undefined'){
    port = process.env.PORT;
}
app.listen(port);
