'use strict';

var Q = require('q');
var _ = require('lodash');
var articleCounter = 1;

var CompanyProvider = function(){
};

var dummyData = {'My-Texas-Restaurant-Santa-Francisco-TX': {
  title: 'My Texas Restaurant 1',
  state: 'TX',
  county: 'maverick',
  city: 'San Jose',
  valuation: 100000,
  description_short_text: 'fds'
},'My-Texas-Restaurant-Santa-Clara-TX': {
  title: 'My Texas Restaurant 2',
  state: 'AZ',
  county: 'zavala',
  city: 'San Jose',
  valuation: 300000,
  description_short_text: 'fds'
},'My-Texas-Restaurant-San-Jose-TX': {
  title: 'My Texas Restaurant 3',
  state: 'TX',
  county: 'starr',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
}};

CompanyProvider.prototype.findById = function(id) {
  console.log('findById');
  return Q.fcall(function(){
    var result = null;
    if (typeof(dummyData[id]) !== 'undefined'){
      result = dummyData[id];
    }
    return result;
  });
};

CompanyProvider.prototype.findByRegion = function(state,county,city) {
  console.log('findByRegion');
  return Q.fcall(function(){
    var result = null;
    _(dummyData).forIn(function(v,id){
      if (v.state.toLowerCase() === state.toLowerCase().replace('-',' ') && (typeof(county) === 'undefined' || v.county.toLowerCase() === county.toLowerCase().replace('-',' ')) && (typeof(city) === 'undefined' || v.city.toLowerCase() === city.toLowerCase().replace('-',' ')) ){
        result = v;
        return result;
      }
    });
    return result;
  });
};

CompanyProvider.prototype.save = function(companies) {
  var company = null;

  if( typeof(companies.length) === 'undefined'){
    companies = [companies];
  }
  for( var i =0;i< companies.length;i++ ) {
    company = companies[i];
    company._id = articleCounter++;
    company.created_at = new Date();

    dummyData[dummyData.length]= company;
  }
};

module.exports = CompanyProvider;
