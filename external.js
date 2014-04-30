/* jslint node: true */
'use strict';

function Yelp(){
	var client = require('yelp').createClient({
	  consumer_key: 'HnrWS3JCE4g4wbaCrVC0wg',
	  consumer_secret: 'XQfhrgq1yJoYnJjxFIOlDut-C44',
	  token: '6pCeJihtCBUdcLZu9uSm1eRij20a-sYH',
	  token_secret: 'FcNRGSLGxAWa-O8JWv4MPFPn0hs'
	});
	this.fetchList = function(location){
		client.search({limit: 20, offset: 100, location: 'Zavala County, TX'}, function(error, data) {
	      console.log(error);
	      res.send(data);
	    });

	};
}


module.exports = Yelp;