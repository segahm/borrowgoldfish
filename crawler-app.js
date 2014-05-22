// Returns a list of email and full page content
var IGNORED_EXTENSIONS = [
//images
'mng', 'pct', 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'pst', 'psp', 'tif',
'tiff', 'ai', 'drw', 'dxf', 'eps', 'ps', 'svg',

//audio
'mp3', 'wma', 'ogg', 'wav', 'ra', 'aac', 'mid', 'au', 'aiff',

//video
'3gp', 'asf', 'asx', 'avi', 'mov', 'mp4', 'mpg', 'qt', 'rm', 'swf', 'wmv',
'm4a',

//other
'css', 'pdf', 'doc', 'exe', 'bin', 'rss', 'zip', 'rar'
];

var EightyApp = function() {
	this.processDocument = function(html, url, headers, status, jQuery) {
		var app = this;
		$ = jQuery;
		var $html = app.parseHtml(html, $);
		var object = {};

		// Get emails
		var emailList = [];
		emailList = html.match(/[_a-z0-9-\+]+(\.[_a-z0-9-\+]+)*@[a-z0-9-]+(\.[a-z0-9]+)*(\.[a-z]{2,})/gi);
		object.emailList = emailList;

		// Get twitter accounts
		var twitterList = [];
		//add meta twitter handle
		$html.filter('meta').each(function(i, obj) {
			console.log($(this).attr('name'));
			if ($(this).attr('name') === 'twitter:creator'){
				twitterList.push($(this).attr('content').slice(1));
			}
		});

		if (twitterList.length === 0){
			//links to a twitter page
			var temp = html.match(/(https?:)?\/\/(www\.)?twitter.com\/(#!\/)?[^"> ]+/ig);	//grab all twitter links
			var handle;
			temp.every(function(obj,i) {
				console.log('match: '+obj);
				obj = obj.toLowerCase();
				if (obj.indexOf('/home') > 0){
					console.log('home: ');
					//ignore
				}else if (obj.indexOf('/share') > 0){
					console.log('share: ');
					handle = obj.match(/via=([a-z_0-9]+)/);
					if (handle){
						twitterList.push(handle[1]);
					}
				}else{
					console.log('link: ');
					handle = obj.match(/.com\/([^"\/ ]+)/);
					if (handle){
						twitterList.push(handle[1]);
					}
				}
			});
			/*twitterList = twitterList?twitterList:[];
			twitterList.every(function(obj,i) {
				twitterList[i] = obj.replace(/^.+\.com\//ig,'');
				//twitterList[i] = twitterList[i].match(/home|share/i)
			});
			//share buttons
			twitterList = html.match(/https:\/\/twitter.com\/share.+via=([a-z_0-9]+)/ig);
			twitterList = twitterList?twitterList:[];
			twitterList.every(function(obj,i) {
				twitterList[i] = obj.replace(/^.+\.com\//ig,'');
			});*/
		}


		/*if (twitterList){
			for (var i=0;i<twitterList.length;i++){
				if (twitterList[i][1]){
					twitterList[i] = twitterList[i][1];
				}
			}
		}*/
		object.twitterList = twitterList;
		// Get facebook accounts

		return JSON.stringify(object);
	};

	this.parseLinks = function(html, url, headers, status, jQuery) {
		var app = this;
		var $ = jQuery;
		var $html = app.parseHtml(html, $);
		var links = [];

		function getDomain(link){
			var matches = link.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
			return (matches && matches[1]);
		}
		function isValidExtension(link){
			var formated = link.toLowerCase().replace(/\?.*$/g,'').replace(/^.+\.[a-z]+\//g, '');
			formated = formated.split('.');
			var ext = formated[formated.length-1];
			for (var i=0;i<IGNORED_EXTENSIONS.length;i++){
				var type = IGNORED_EXTENSIONS[i];
				if (ext === type){
					return false;
				}
			}
			return true;
		}
		var domain = getDomain(url).toLowerCase();

		if (!url.match(/facebook|myspace/i)){
			// gets all links in the html document
			$html.find('a').each(function(i, obj) {
				var link = app.makeLink(url, $(this).attr('href'));
				if(link !== null && getDomain(link).toLowerCase() === domain && isValidExtension(link)) {
					if (link.match(/contact|info/i)){
						links.unshift(link);
					}else{
						links.push(link);
					}
				}
			});
		}

		links.splice(5);	//no more than 5 links per page
		return links;
	};
};

try {
	// Testing
	module.exports = function(EightyAppBase) {
		EightyApp.prototype = new EightyAppBase();
		return new EightyApp();
	}
} catch(e) {
	// Production
	console.log("Eighty app exists.");
	EightyApp.prototype = new EightyAppBase();
}
