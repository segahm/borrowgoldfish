'use strict';

var Q = require('q');
var articleCounter = 1;

var CompanyProvider = function(){
};

var dummyData = [{
  title: 'My Texas Restaurant 1',
  state: 'TX',
  county: 'maverick',
  city: 'San Jose',
  valuation: 300000,
  company_id:'My-Texas-Restaurant-Santa-Francisco-TX',
  description_short_text: 'fds'
},{
  title: 'My Texas Restaurant 2',
  state: 'TX',
  county: 'zavala',
  city: 'San Jose',
  valuation: 300000,
  company_id:'My-Texas-Restaurant-Santa-Clara-TX',
  description_short_text: 'fds'
},{
  title: 'My Texas Restaurant 3',
  state: 'TX',
  county: 'starr',
  city: 'San Jose',
  valuation: 300000,
  company_id:'My-Texas-Restaurant-San-Jose-TX',
  description_short_text: 'fds'
}];

CompanyProvider.prototype.findByState = function(state) {
  console.log('findByState');
  return Q.fcall(function(){
    return dummyData;
  });
};

CompanyProvider.prototype.findByCity = function(state,city) {
  console.log('findByCity');
  return Q.fcall(function(){
    return dummyData;
  });
};

CompanyProvider.prototype.findByCounty = function(state,county) {
  console.log('findByCounty');
  return Q.fcall(function(){
    return dummyData;
  });
};

CompanyProvider.prototype.findById = function(id) {
  console.log('findById');
  return Q.fcall(function(){
    console.log(dummyData);
    var result = null;
    for(var i =0;i<dummyData.length;i++) {
      if( dummyData[i].company_id === id ) {
        result = dummyData[i];
        break;
      }else{
        console.log('no match');
      }
    }
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
