'use strict';

var Q = require('q');
var _ = require('lodash');
//var articleCounter = 1;

var CompanyProvider = function(){
};

function findSimilar(id,category,postcode,county,valuation){
  console.log('findSimilar');
  var knex = require('knex').knex;
  var request = knex('companies').select(knex.raw('id,title,price,meal_breakfast,meal_lunch,meal_dinner,meal_deliver,meal_takeout,meal_cater,alcohol,days_open,abs(valuation-'+valuation+') as dev'))
    .where('category',category).andWhere('postcode','<>',postcode).andWhere('county',county)
    .orderBy('dev','asc').limit(6);
  return request.then(function(data){
    return data;
  });
}

function top3Counties(data,county){
  var top3_counties = [];
  var this_county;
  var lcounty = county.toLowerCase();
  /*** get top 3 counties by ***/
  _(data).forEach(function(row){
    var lowerc = row.county.toLowerCase();
    var item = [row.county,row.density,row.people];
    if (lcounty === lowerc){
      this_county = item;
    }else{
      top3_counties.push(item);
    }
  });
  top3_counties.sort(function(a,b){return b[1]-a[1];});
  top3_counties.splice(2);
  top3_counties.push(this_county);
  var items = {};
  _(top3_counties).forEach(function(v){
    items[v[0]] = {density: v[1],people: v[2]};
  });
  return items;
}
//var dummyData;
CompanyProvider.prototype.regionalStats = function(state,county,category){
  console.log('regionalStats');
  var knex = require('knex').knex;

  var top3ByDensity;
  //first find out how many people/county in each county within a state
  var request = knex('regions').column('county','people','density')
    .where('state',state.toUpperCase()).orderBy('density','desc');  //need at least 2 != to this county
  return request.then(function(data){
    top3ByDensity = top3Counties(data,county);
    request = knex('companies')
      .where('state',state.toUpperCase()).groupBy('county').count('id')
      .column('county').andWhere('category','ilike',category)
      .whereIn('county',Object.keys(top3ByDensity));
    return request;
  }).then(function(data){
    //assign category density to existing top 3
    _(data).forEach(function(v){
      top3ByDensity[v.county].catDensity = top3ByDensity[v.county].people/v.count;
    });
    return knex('companies')
      .where('state',state.toUpperCase()).groupBy('category').orderBy('count','desc').count('id')
      .column('category').andWhere('county','ilike',county).limit(6);
  }).then(function(data){
    return {
      top_counties: top3ByDensity,
      top_cats: data
    };
  });
};

CompanyProvider.prototype.findById = function(id) {
  console.log('findById');
  var knex = require('knex').knex;
  var request = knex('companies').where('id',id).limit(1).select();
  var result = null;
  return request.then(function(data){
    if (data && data.length){
      result = {company: data[0]};
      return findSimilar(id,data[0].category,data[0].postcode,data[0].county,data[0].valuation);
    }else{
      return null;
    }
  }).then(function(similar){
    if (similar && similar.length){
      result.similar = similar;
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
  var knex = require('knex').knex;
  var request = knex('companies');
  request.where('state',state.toUpperCase());
  if (city){
    request.column('id','title').andWhere('county','ilike',county).andWhere('city','ilike',city);
  }else if(county){
    request.andWhere('county','ilike',county).distinct('city');
  }else{
    request.distinct('county');
  }
  return request.limit(10).select().then(function(data){
    if (!data || !data.length){
      data = null;
    }else if (!city){
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
}*/
module.exports = CompanyProvider;