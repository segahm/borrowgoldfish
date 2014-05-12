'use strict';

var Q = require('q');
var _ = require('lodash');
//var articleCounter = 1;

var CompanyProvider = function(){
};

//var dummyData;
CompanyProvider.prototype.regionalStats = function(state,county,category){
  console.log('regionalStats');
  var knex = require('knex').knex;
  //first find out how many in each county within a state
  var request = knex('regions')
    .where('state',state.toUpperCase()).orderBy('restaurants','desc');
  var result = {};
  return request.column('county','people','restaurants').then(function(data){
    console.log('regionalStats returned 1');
    console.log(data);
    request = knex('companies')
      .where('state',state.toUpperCase()).groupBy('county').count('id');
    return request.column('county').andWhere('category','ilike',category);
  }).then(function(data){
    console.log('regionalStats returned 2');
    console.log(data);
    return knex('companies')
      .where('state',state.toUpperCase()).groupBy('category').orderBy('count','desc').count('id')
      .column('category').andWhere('county','ilike',county).limit(6);
  }).then(function(data){
    console.log('regionalStats returned 3');
    console.log(data);
    return result;
  });
};
CompanyProvider.prototype.findById = function(id) {
  console.log('findById');
  var knex = require('knex').knex;
  var request = knex('companies').where('id',id).limit(1).select();
  return request.then(function(data){
    console.log(data);
    var result = data[0];
    return result;
  });
};
/**
 * returns a list of counties, cities, or company titles along with company_id
 * or null if nothing is found under this search
 */
CompanyProvider.prototype.findByRegion = function(state,county,city) {
  console.log('findByRegion: '+state+','+county+','+city);
  var knex = require('knex').knex;
  var request = knex('companies');
  request.where('state',state.toUpperCase());
  if (city){
    request.column('id','title').andWhere('county','ilike',county).andWhere('city','ilike',city);
  }else if(county){
    request.column('city').andWhere('county','ilike',county).distinct('city');
  }else{
    request.column('county').distinct('county');
  }
  return request.limit(10).select().then(function(data){
    if (data){

    }
    if (!city){
      _(data).forEach(function(company){
        company.title = county?company.city:company.county;
      });
      data = {items: data};
    }else{
      _(data).forEach(function(company){
        company.company_id = company.id;
      });
      data = {companies: data};
    }
    return data;
  });
};

/*
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
*/
module.exports = CompanyProvider;