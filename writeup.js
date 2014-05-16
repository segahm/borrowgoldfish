'use strict';
var _ = require('lodash');
var seedrandom = require('seedrandom');

var DEBUG = false;

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
      console.log('possibly, no data found on similar businesses for:'+this_bus_data);
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
    /*console.log('!!!!!!!!!!!!!similar!!!!!!!!!!!!!!');
    console.log(similar);
    console.log('!!!!!!!!!!own_bus!!!!!!!!!!!');
    console.log(own_bus);*/
    var rng = seedrandom(own_bus.id,{ global: false });

    function genAr(i){
      var rand = Math.round(rng()*i);
      var ar = new Array(rand+1);
      ar[rand] = true;
      return ar;
    }
    function setBitMapsForCompany(i){
      return {
        id: similar[i].id,
        title: similar[i].title,
        price: {
          p: ((similar[i].price && own_bus.price && similar[i].price > own_bus.price) || (!own_bus.price && similar[i].price > 1))?true:false,
          n: ((similar[i].price && own_bus.price && similar[i].price < own_bus.price) || (!similar[i].price && own_bus.price > 1))?true:false
        },
        doors: {
          p: (similar[i].days_open && (!own_bus.days_open || similar[i].days_open > own_bus.days_open))?true:false,
          n: (own_bus.days_open && (!similar[i].days_open || similar[i].days_open < own_bus.days_open))?true:false
        },
        morning: {
          p: ((1*similar[i].meal_breakfast + 1*similar[i].meal_lunch) > (1*own_bus.meal_breakfast + 1*own_bus.meal_lunch))?true:false,
          n: ((1*similar[i].meal_breakfast + 1*similar[i].meal_lunch) < (1*own_bus.meal_breakfast + 1*own_bus.meal_lunch))?true:false
        },
        evening: {
          p: (similar[i].meal_dinner && !own_bus.meal_dinner)?true:false,
          n: (!similar[i].meal_dinner && own_bus.meal_dinner)?true:false
        },
        day: {
          p: ((similar[i].meal_breakfast*1 + similar[i].meal_lunch*1 + similar[i].meal_dinner*1) > (own_bus.meal_dinner*1 + own_bus.meal_breakfast*1 + own_bus.meal_lunch*1))?true:false,
          n: ((similar[i].meal_breakfast*1 + similar[i].meal_lunch*1 + similar[i].meal_dinner*1) < (own_bus.meal_dinner*1 + own_bus.meal_breakfast*1 + own_bus.meal_lunch*1))?true:false,
        },
        alcohol: {
          p: (similar[i].alcohol && !own_bus.alcohol)?true:false,
          n: (!similar[i].alcohol && own_bus.alcohol)?true:false,
        },
        cater: {
          p: (similar[i].cater && !own_bus.cater)?true:false,
          n: (!similar[i].cater && own_bus.cater)?true:false,
        },
        deliver: {
          p: (similar[i].deliver && !own_bus.deliver)?true:false,
          n: (!similar[i].deliver && own_bus.deliver)?true:false,
        }
      };
    }
    var result = {
      praise: genAr(3),
      loc: genAr(1),
      join: [],
      company1: {
        price: {},
        doors: {},
        morning: {},
        evening: {},
        day: {},
        alcohol: {},
        cater: {},
        deliver: {}
      },
      company2: {fact: []}
    };
    if (similar.length > 0){
      result.company1 = setBitMapsForCompany(0);
      result.company1.found = true;
      result.company1.map = 'http://maps.google.com/?q='+encodeURIComponent(similar[0].address+', '+similar[0].city+', '+similar[0].state)+'&output=classic';
      //TEMPORARY
      if (DEBUG){
        result.company1 = {
          price: {p: true, n: true},
          doors: {p: true, n: true},
          morning: {p: true,n: true},
          day: {p: true,n: true},
          evening: {p: true, n: true},
          alcohol: {p: true,n: true},
          cater: {p: true,n: true},
          deliver: {p: true,n: true}
        };
      }
      var ordered_fields = ['price','doors','morning','evening','day','alcohol','cater','deliver'];
      var stack = -1;
      var last = -1;
      _(ordered_fields).forIn(function(field,index){
        if (result.company1[field] === true || (typeof(result.company1[field].p) !== 'undefined' && result.company1[field].p === true) || (typeof(result.company1[field].n) !== 'undefined' && result.company1[field].n === true)){
          if (stack !== -1){
            result.join[stack] = ', ';
            last = stack;
          }
          stack = index;
        }
      });
      if (last !== -1){
        result.join[last] = ', and ';
      }
    }
    if (similar.length > 1){
      var bitmap = setBitMapsForCompany(1);
      result.company2 = {
        id: similar[1].id,
        title: similar[1].title,
        map: 'http://maps.google.com/?q='+encodeURIComponent(similar[1].address+', '+similar[1].city+', '+similar[1].state)+'&output=classic'
      };
      result.company2.found = true;
      result.company2.fact = [false,false,false,false,false];
      if (bitmap.price.p || bitmap.alcohol.p || bitmap.cater.p){
        result.company2.fact[0] = true;
      }else if (bitmap.deliver.p || bitmap.day.p || bitmap.doors.p){
        result.company2.fact[1] = true;
      }else if (bitmap.morning.p || bitmap.evening){
        result.company2.fact[2]= true;
      }else if (bitmap.price.n || bitmap.alcohol.n || bitmap.cater.n){
        result.company2.fact[3] = true;
      }else if (bitmap.deliver.n || bitmap.day.n || bitmap.doors.n){
        result.company2.fact[4] = true;
      }
      if (DEBUG){
        result.company2.fact = [true,true,true,true,true];
      }
    }
    if (result.join.length > 0){
      result.company1.found = true;
    }
    return result;
  };
}

module.exports = CompanyWriter;