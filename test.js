var Crawler = require('./crawler-app');
var fs = require('fs');

fs.readFile('./Crawler/site.html', function (err, html) {
  if (err) throw err;
  console.log(Crawler.prototype.processDocument(html));
});
