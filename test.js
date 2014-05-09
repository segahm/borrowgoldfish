'use strict';

var Q = require('q');
var _ = require('lodash');

var s = {'a': 1, 'b': 2};
var c = {'c': 1,'d': 3};

console.log(_.merge(s,c));
