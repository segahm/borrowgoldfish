'use strict';

var Q = require('q');
var articleCounter = 1;

var CompanyProvider = function(){};
CompanyProvider.prototype.dummyData = [];

CompanyProvider.prototype.findByState = function(state) {
  return Q.fcall(function(){
    return this.dummyData;
  });
};

CompanyProvider.prototype.findByCity = function(state,city) {
  return Q.fcall(function(){
    return this.dummyData;
  });
};

CompanyProvider.prototype.findByCounty = function(state,county) {
  return Q.fcall(function(){
    return this.dummyData;
  });
};

CompanyProvider.prototype.findById = function(id) {
  return Q.fcall(function(){
    var result = null;
    for(var i =0;i<this.dummyData.length;i++) {
      if( this.dummyData[i]._id === id ) {
        result = this.dummyData[i];
        break;
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

    this.dummyData[this.dummyData.length]= company;
  }
};

/* Lets bootstrap with dummy data */
new CompanyProvider().save([
  {title: 'gfdgdf gfdgd',state: 'TX',county: 'Santa Clara', city: 'San Jose',valuation: 300000}

]);

module.exports = CompanyProvider;