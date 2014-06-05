//My App

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
		var object = {};
		try{
			var $html = app.parseHtml(html, $);

			// Get emails
			var emailList = [];
			emailList = html.match(/[_a-z0-9-\+]+(\.[_a-z0-9-\+]+)*@[a-z0-9-]+(\.[a-z0-9]+)*(\.[a-z]{2,})/gi);
			object.emailList = emailList;

			// Get twitter accounts
			var twitteHandles = {};
			//add meta twitter handle
			$html.filter('meta').each(function(i, obj) {
				if ($(this).attr('name') === 'twitter:creator'){
					twitteHandles[$(this).attr('content').slice(1)] = 1;
				}
			});

			if (Object.keys(twitteHandles).length === 0){
				//links to a twitter page
				var temp = html.match(/(https?:)?\/\/(www\.)?twitter.com\/(#!\/)?[^"> ]+/ig);	//grab all twitter links
				temp = temp?temp:[];
				var handle;
				temp.forEach(function(obj) {
					obj = obj.toLowerCase();
					if (obj.indexOf('/home') > 0){
						//ignore
					}else if (obj.indexOf('/share') > 0){
						handle = obj.match(/via=([a-z_0-9]+)/);
						if (handle){
							twitteHandles[handle[1]] = 1;
						}
					}else if (obj.indexOf('/intent') > 0){
						handle = obj.match(/via=([a-z_0-9]+)/);
						if (handle){
							twitteHandles[handle[1]] = 1;
						}
					}else if (obj.indexOf('/tweet') > 0){
						handle = obj.match(/screen_name=([a-z_0-9]+)/);
						if (handle){
							twitteHandles[handle[1]] = 1;
						}
					}else{
						handle = obj.match(/.com\/(#!\/)?([^"\/ ]+)/);
						if (handle){
							twitteHandles[handle[handle.length-1]] = 1;
						}
					}
				});
			}
			object.twitterList = Object.keys(twitteHandles);
			// Get facebook accounts
			return JSON.stringify(object);
		}catch(e){
		}
		return JSON.stringify({twitterList: [],emailList: []});
	};

	this.parseLinks = function(html, url, headers, status, jQuery) {
		var app = this;
		var $ = jQuery;
		var $html = app.parseHtml(html, $);
		var links = {};
		var links_list = [];
		url = url.toLowerCase();
		try{
			function getDomain(link){
				var matches = link.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#].*|$)/i);
				return (matches && matches[1]);
			}
			function isValidExtension(link){
				try{
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
				}catch(e){
					return false;
				}
			}
			var domain = getDomain(url).toLowerCase();
			if (!url.match(/facebook|myspace/)){
				// gets all links in the html document
				$html.find('a').each(function(i,obj) {
					var link = app.makeLink(url, $(this).attr('href').toLowerCase());
					if(link && getDomain(link) === domain && isValidExtension(link) && link !== url
						&& !link.match(/mailto:/)) {
						if (link.match(/contact|info/i)){
							links[link] = 1;
						}else{
							links[link] = 0;
						}
					}
				});
			}
			links_list = Object.keys(links);
			//put contact links forward
			links_list.sort(function(a,b){
				return (links[b] - links[a]);
			});

			links_list.splice(5);	//no more than 5 links per page
			return links_list;
		}catch(e){
			return [];
		}
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
