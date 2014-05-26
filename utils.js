'use strict';

var Q = require('q');
var _ = require('lodash');


var Utility = function(){
};

Utility.prototype.hashCode = function(str){
  /* jshint bitwise: false */
  var hash = 5381, char;
  for (var i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return Math.abs(hash).toString();
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