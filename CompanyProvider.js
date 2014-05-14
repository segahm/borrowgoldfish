'use strict';

var Q = require('q');
var _ = require('lodash');
//var articleCounter = 1;

var similar_fields = ['price','meal_breakfast','meal_lunch','meal_dinner','meal_deliver','meal_takeout','meal_cater','alcohol','days_open'];

var sum_of_nulls = [];
_(similar_fields).forEach(function(field_name){
  sum_of_nulls.push('(CASE WHEN '+field_name+' IS NULL THEN 1 ELSE 0 END)');
});
sum_of_nulls = '('+sum_of_nulls.join(' + ')+') AS sum_of_nulls';

var CompanyProvider = function(){
};

function findSimilar(id,category,postcode,county,valuation){
  var knex = require('knex').knex;
  var request = knex('companies')
    .where('category',category).andWhere('postcode','<>',postcode).andWhere('county',county)
    .orderBy('is_greater','desc')
    .orderBy('sum_of_nulls','asc')
    .orderBy('dev','asc').limit(6).select(
    knex.raw(sum_of_nulls+','+similar_fields+',id,title,abs(valuation-'+valuation+') as dev, (CASE WHEN valuation > '+valuation+' THEN 1 ELSE 0 END) as is_greater'));
  return request;
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
  var knex = require('knex').knex;
  var state = state.toUpperCase();
  var top3ByDensity,
      hourly_density;
  //first find out how many people/county in each county within a state
  var request = knex('regions').column('county','people','density')
    .where('state',state).orderBy('density','desc');  //need at least 2 != to this county
  return request.then(function(data){
    top3ByDensity = top3Counties(data,county);
    request = knex('companies').select(knex.raw('county,\'m\' as period')).whereIn('county',Object.keys(top3ByDensity))
      .where('state',state).groupBy('county').count('id').where('meal_breakfast',true)
      .union(function(){
        this.select(knex.raw('county,\'a\' as period')).from('companies').where('state',state).groupBy('county').count('id')
        .whereIn('county',Object.keys(top3ByDensity)).where('meal_lunch',true).union(function() {
          this.select(knex.raw('county,\'d\' as period')).from('companies').where('state',state).groupBy('county').count('id')
          .whereIn('county',Object.keys(top3ByDensity)).where('meal_dinner',true);
        });
      });
/*    request = knex('companies')
      .where('state',state.toUpperCase()).groupBy('county').count('id')
      .column('county').andWhere('category','ilike',category)
      .whereIn('county',Object.keys(top3ByDensity));*/
    return request;
  }).then(function(data){
    if (data){
      hourly_density = {};
      _(data).forEach(function(v){
        if (typeof(hourly_density[v.county]) === 'undefined'){
          hourly_density[v.county] = {};
        }
        hourly_density[v.county][v.period] = v.count;
      });
    }
    //assign category density to existing top 3
    /*_(data).forEach(function(v){
      top3ByDensity[v.county].catDensity = top3ByDensity[v.county].people/v.count;
    });*/
    return knex('companies')
      .where('state',state).groupBy('category').orderBy('count','desc').count('id')
      .column('category').andWhere('county','ilike',county)
      .andWhere('category','<>','Food and Dining,Restaurants');
  }).then(function(data){
    var result = {};
    var total_restaurants = 0;
    var how_many_cats = 0;
    if (data){
      _(data).forEach(function(cat){
        if (how_many_cats < 4){
          result[cat.category.replace(/Food and Dining\,(Restaurants\,)?/,'')] = cat.count;
          how_many_cats++;
        }
        total_restaurants += parseInt(cat.count,10);
      });
    }
    return {
      hourly_density: hourly_density,
      top_counties: top3ByDensity,
      top_cats: result,
      total_restaurants: total_restaurants
    };
  });
};

CompanyProvider.prototype.findById = function(id) {
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
  return request.select().then(function(data){
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