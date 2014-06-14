'use strict';

var _ = require('lodash');

var HOME_PAGE_IDS = require('./sample_ids');
var HOME_PAGE_IDS_LENGTH = Object.keys(HOME_PAGE_IDS).length;
var HOME_PAGE_KEYS = {};
_(HOME_PAGE_IDS).forEach(function(restaurant){
  HOME_PAGE_KEYS[restaurant.id] = restaurant.twitter;
});

var Utility = function(){
};
Utility.prototype.HOME_PAGE_IDS = HOME_PAGE_IDS;
Utility.prototype.HOME_PAGE_KEYS = HOME_PAGE_KEYS;


Utility.prototype.hashCode = function(str){
  /* jshint bitwise: false */
  var hash = 5381, char;
  for (var i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return Math.abs(hash).toString();
};
Utility.prototype.toTitleCase = function(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace(/_/g,' ');
};

Utility.prototype.join = function(array,key,with_el){
  var str = '';
  _(array).forEachRight(function(v){
    str += v[key]+with_el;
  });
  return str.slice(0,str.length-with_el.length);
};

Utility.prototype.formatValuation = function(valuation){
  if (valuation){
    valuation = Math.round(valuation/100)*100;
    valuation = valuation.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return valuation;
};

Utility.prototype.getRandomRestaurants = function(howMany){
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
};

Utility.prototype.listPages = function(){
 /* return  [
        { url: '/page-1/',  changefreq: 'daily', priority: 0.3 },
        { url: '/page-2/',  changefreq: 'monthly',  priority: 0.7 },
        { url: '/page-3/' }     // changefreq: 'weekly',  priority: 0.5
      ];*/
  var knex = require('knex').knex;
  var request = knex('companies').column('id','city','state','county').select();
  //var request = knex('companies').select(knex.raw("concat('/',id) as url,'daily' as changefreq,city,state,county"));
  return request.then(function(data){
    var result = new Array(data.length*2);
    var states = {};
    for (var row = 0;row<data.length;row++){
      result[row] = {url: '/'+data[row].id,changefreq: 'daily'};
      result[row*2] = {url: '/es/'+data[row].id,changefreq: 'daily'};
      if (typeof(states[data[row].state]) === 'undefined'){
        states[data[row].state] = {};
        states[data[row].state][data[row].county] = {};
        states[data[row].state][data[row].county][data[row].city] = 1;
      }else if(typeof(states[data[row].state][data[row].county]) === 'undefined'){
        states[data[row].state][data[row].county] = {};
        states[data[row].state][data[row].county][data[row].city] = 1;
      }else if(typeof(states[data[row].state][data[row].county][data[row].city]) === 'undefined'){
        states[data[row].state][data[row].county][data[row].city] = 1;
      }
    }
    var link;
    _(states).forIn(function(val,state){
      link = {url: ('/'+state).toLowerCase().replace(/[ ]/g,'_'), changefreq: 'monthly'};
      result.push(link);
      result.push({url: ('/es'+link.url), changefreq: 'monthly'});
      _(val).forIn(function(v2,county){
        link = {url: ('/'+state+'/'+county).toLowerCase().replace(/[ ]/g,'_'), changefreq: 'weekly'};
        result.push(link);
        result.push({url: ('/es'+link.url), changefreq: 'weekly'});
        _(v2).forIn(function(v3,city){
          link = {url: ('/'+state+'/'+county+'/'+city).toLowerCase().replace(/[ ]/g,'_'), changefreq: 'weekly'};
          result.push(link);
          result.push({url: ('/es'+link.url), changefreq: 'weekly'});
        });
      });
    });
    //_.merge(
    return result;
  });
};

module.exports = Utility;