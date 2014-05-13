'use strict';
var _ = require('lodash');
function CompanyWriter(){
  this.naming_keys = [
    'price',
    'meal_breakfast',
    'meal_lunch',
    'meal_dinner',
    'meal_deliver',
    'meal_takeout',
    'meal_cater',
    'alcohol',
    'days_open',
  ];
  this.array_to_object = function(elements){
    var obj = {};
    for (var col_i=0;col_i<elements.length;col_i++){
      obj[this.naming_keys[col_i]] = elements[col_i];
    }
    return obj;
  };
  this.countVariety = function(row1,row2){
    var variety_elements = 0;
    console.log(row1);
    console.log(row2);
    _(this.naming_keys).forEach(function(key){
      if (row1[key] !== row2[key]){
        variety_elements++;
      }
    });
    console.log(variety_elements);
    return variety_elements;
  };
  this.write = function(data,this_bus_data){
    var distinct = {};
    var new_data = [];
    try{
      
      for (var row=0;row<data.length;row++){
        var name = data[row].title;
        //first, remove businesses with same name/title (which is not unique, but looks bad in a description) 
        var varietyCount;
        if (typeof(distinct[name]) === 'undefined'){
          //second, remove the ones that have all the same columns as our business
          if ((varietyCount = this.countVariety(data[row],this_bus_data)) > 0){
            distinct[name] = varietyCount;
            new_data.push(data[row]);
          }
        }
      }
      //descending sort based on variety
      new_data = new_data.sort(function(a, b) {
        return distinct[b.title] - distinct[a.title];
      });
      new_data.splice(2);
      return this.writeTemplate(new_data,this_bus_data);
    }catch(e){
      console.log(e);
      console.log('possibly, no data found on similar businesses for:'+this_bus_data[0][1]);
    }
  };
/*
 'name',
    'id',
    'price',
    'meal_breakfast',
    'meal_lunch',
    'meal_dinner',
    'meal_deliver',
    'meal_takeout',
    'meal_cater',
    'alcohol',
    'days_open',
*/
  this.writeTemplate = function(similar,own_bus){
    return {praise: [true],
          loc: [true],
          join: [true],
          company1: {price: {}, doors: {}},
          company2: {}};
  };
}

module.exports = CompanyWriter;