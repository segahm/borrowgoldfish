'use strict';

var _           = require('lodash'),
    util        = require('util'),
    restify     = require('restify'),
    bugsnag     = require('bugsnag'),

    errorTypes  = [ 'InvalidCredentials', 'NotAuthorized', 'BadRequest', 'NotFound' ],
    errors;

/**
 * Basic error handling helpers
 */
errors = {
  throwError: function (err) {
    if (!err) {
      err = new Error('An error occurred');
    }

    if (_.isString(err)) {
      throw new Error(err);
    }

    throw err;
  },

  logError: function (err) {
    console.log(err);
  },

  logErrorAndExit: function (err) {
    this.logError(err);
    // Exit with 0 to prevent npm errors as we have our own
    process.exit(0);
  },

  logAndThrowError: function (err) {
    this.logError(err);
    this.throwError(err);
  },

  handle: function(next) {
    return function(err) {
      if (err.message === 'EmptyResponse' || err.name === 'NotFound') {
        return next(new restify.NotFoundError());
      } else if (err.name === 'ValidatorError' || err.name === 'BadRequest') {
        return next(new restify.BadRequestError(err.message));
      } else if (err.name === 'NotAuthorized') {
        return next(new restify.NotAuthorizedError(err.message));
      } else if (err.name === 'InvalidCredentials') {
        return next(new restify.InvalidCredentialsError(err.message));
      }

      if (!(err instanceof Error)) {
        var error = new Error('UnknownError');
        if (err.body) {
          error.body = err.body;
        }
        else if (err.data) {
          error.body = err.data;
        }
        if (err.statusCode) {
          error.statusCode = err.statusCode;
        }
        err = error;
      }
      return next(err);
    };
  },

  notifyRequestError: function(req, res, route, err) {
    if (res.statusCode === 404) {
      // a bit hacky. not found errors are handled differently by restify
      err = res._body;
    }
    if (err) {
      bugsnag.notify(err, {
        req: req
      });
    }
  }
};

// Ensure our 'this' context in the functions
_.bindAll(
  errors,
  'throwError',
  'logError',
  'logErrorAndExit',
  'logAndThrowError'
);


function AbstractError(msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Error';
}
util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'AbstractError';

errorTypes.forEach(function (errorName) {
  var errorFn = errors[errorName + 'Error'] = function (msg) {
    errorFn.super_.call(this, msg, this.constructor);
  };
  util.inherits(errorFn, AbstractError);
  errorFn.prototype.name = errorName;
});

module.exports = errors;