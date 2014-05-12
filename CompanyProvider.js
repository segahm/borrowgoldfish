'use strict';

var Q = require('q');
var _ = require('lodash');
var articleCounter = 1;

var CompanyProvider = function(){
};

var dummyData;

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
/**
 * returns a list of counties, cities, or company titles along with company_id
 * or null if nothing is found under this search
 */
CompanyProvider.prototype.findByRegion = function(state,county,city) {
  console.log('findByRegion: '+state+','+county+','+city);
  return Q.fcall(function(){
    var result = [];
    _(dummyData).forIn(function(v,id){
      if (v.state.toLowerCase() === state.toLowerCase() && (!county || v.county.toLowerCase() === county.toLowerCase()) && (!city || v.city.toLowerCase() === city.toLowerCase()) ){
        if (city){
          v.company_id = id;
          result.push({
            company_id: id,
            title: v.title
          });
        }else if(county){
          result.push({
            title: v.city
          });
        }else{
          result.push({
            title: v.county
          });
        }
      }
    });
    if (result.length){
      //what kind of output - categories or lists
      result = (typeof(result[0].company_id) !== 'undefined')?{companies: result}:{items: result};
    }
    console.log(result);
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



dummyData = {'My-Texas-Restaurant-Santa-Francisco-TX': {
  title: 'My Texas Restaurant 1',
  state: 'TX',
  county: 'Maverick',
  city: 'San Jose',
  valuation: 100000,
  description_short_text: 'fds'
},'My-Texas-Restaurant-Santa-Clara-TX': {
  title: 'My Texas Restaurant 2',
  state: 'TX',
  county: 'Zavala',
  city: 'San Jose',
  valuation: 300000,
  description_short_text: 'fds'
},'My-Texas-Restaurant-San-Jose-TX': {
  title: 'My Texas Restaurant 3',
  state: 'TX',
  county: 'Starr',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Webb',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid1': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Hidalgo',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid2': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Zapata',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid3': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Cameron',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid5': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Val Verde',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid6': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'El Paso',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid7': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Duval',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid8': {
  title: 'fake restaurant',
  state: 'FL',
  county: 'Miami-Dade',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid9': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Willacy',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid10': {
  title: 'fake restaurant',
  state: 'NM',
  county: 'San Miguel',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid11': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Frio',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid12': {
  title: 'fake restaurant',
  state: 'CA',
  county: 'Imperial',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid13': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Uvalde',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid14': {
  title: 'fake restaurant',
  state: 'AZ',
  county: 'Santa Cruz',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid15': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Kleberg',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid16': {
  title: 'fake restaurant',
  state: 'TX',
  county: 'Reeves',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid17': {
  title: 'fake restaurant',
  state: 'NM',
  county: 'Dona Ana',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid18': {
  title: 'fake restaurant',
  state: 'NM',
  county: 'Guadalupe',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
},'fakeid19': {
  title: 'fake restaurant',
  state: 'FL',
  county: 'Osceola',
  city: 'San Jose',
  valuation: 500000,
  description_short_text: 'fds'
}};

module.exports = CompanyProvider;