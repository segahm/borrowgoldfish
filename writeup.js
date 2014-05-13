'use strict';
var _ = require('lodash');
var seedrandom = require('seedrandom');

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
    _(this.naming_keys).forEach(function(key){
      if (row1[key] !== null && row1[key] !== row2[key]){
        variety_elements++;
      }
    });
    return variety_elements;
  };
  this.write = function(data,this_bus_data){
    var distinct = {};
    var new_data = [];
    try{
      distinct[this_bus_data.title] = 1;
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
    console.log('!!!!!!!!!!!!!similar!!!!!!!!!!!!!!');
    console.log(similar);
    console.log('!!!!!!!!!!own_bus!!!!!!!!!!!');
    console.log(own_bus);
    var rng = seedrandom(own_bus.id,{ global: false });
    function genAr(i){
      var rand = Math.round(rng()*i);
      var ar = new Array(rand+1);
      ar[rand] = true;
      return ar;
    }
    return {
      praise: genAr(3),
      loc: genAr(1),
      join: [],
      company1: {
        id: similar[0].id,
        title: similar[0].title,
        price: {
          p: ((similar[0].price && own_bus.price && similar[0].price > own_bus.price) || (!own_bus.price && similar[0].price > 1))?true:false,
          n: (similar[0].price && own_bus.price && similar[0].price < own_bus.price)?true:false
        },
        doors: {
          p: (similar[0].days_open && (!own_bus.days_open || similar[0].days_open > own_bus.days_open))?true:false,
          n: (similar[0].days_open && own_bus.days_open && similar[0].days_open < own_bus.days_open)?true:false
        },
        morning: ((similar[0].meal_breakfast || similar[0].meal_lunch) && !(own_bus.meal_breakfast || own_bus.meal_lunch))?true:false,
        evening: (similar[0].meal_dinner && !own_bus.meal_dinner)?true:false,
        day: {
          p: ((similar[0].meal_breakfast*1 + similar[0].meal_lunch*1 + similar[0].meal_dinner*1) > (own_bus.meal_dinner*1 + own_bus.meal_breakfast*1 + own_bus.meal_lunch*1))?true:false,
          n: ((similar[0].meal_breakfast*1 + similar[0].meal_lunch*1 + similar[0].meal_dinner*1) < (own_bus.meal_dinner*1 + own_bus.meal_breakfast*1 + own_bus.meal_lunch*1))?true:false,
        },
        alcohol: (similar[0].alcohol && !own_bus.alcohol)?true:false,
        cater: (similar[0].cater && !own_bus.cater)?true:false,
        deliver: (similar[0].deliver && !own_bus.deliver)?true:false,
        takeout: (similar[0].takeout && !own_bus.takeout)?true:false,
      },
      company2: {}
    };
  };
}

module.exports = CompanyWriter;