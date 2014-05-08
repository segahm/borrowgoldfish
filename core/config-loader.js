'use strict';

var fs      = require('fs'),
    path    = require('path'),
    Q       = require('q'),
    bunyan  = require('bunyan'),
    errors  = require('./error-handling'),

    appRoot = path.resolve(__dirname, '../'),
    configExample = path.join(appRoot, 'config.example.js'),
    config = path.join(appRoot, 'config.js');

function writeConfigFile() {
  var written = Q.defer();

  /* Check for config file and copy from config.example.js
   if one doesn't exist. After that, start the server. */
  fs.exists(configExample, function checkTemplate(templateExists) {
    var read,
        write;

    if (!templateExists) {
      return errors.logError(new Error('Could not locate a configuration file. Please check your deployment for config.js or config.example.js.'));
    }

    // Copy config.example.js => config.js
    read = fs.createReadStream(configExample);
    read.on('error', function () {
      return errors.logError(new Error('Could not open config.example.js for read. Please check your deployment for config.js or config.example.js.'));
    });
    read.on('end', written.resolve);

    write = fs.createWriteStream(config);
    write.on('error', function () {
      return errors.logError(new Error('Could not open config.js for write. Please check your deployment for config.js or config.example.js.'));
    });

    return read.pipe(write);
  });

  return written.promise;
}

function validateConfigEnvironment() {
  var envVal = process.env.NODE_ENV || 'undefined',
      hasPort,
      hasSocket,
      config;

  try {
    config = require('../config')[envVal];
  } catch (ignore) {

  }

  // Check if we don't even have a config
  if (!config) {
    errors.logError(new Error('Cannot find the configuration for the current NODE_ENV ('+ envVal + '). Ensure your config.js has a section for the current NODE_ENV value.'));
    return Q.reject();
  }

  // Check that we have database values
  if (!config.database || !config.database.relational) {
    errors.logError(new Error('Your database configuration in config.js is invalid. Please make sure this is a valid bookshelf database configuration.'));
    return Q.reject();
  }

  if (!config.database || !config.database.document) {
    errors.logError(new Error('Your database configuration in config.js is invalid. Please make sure this is a valid mongoskin database configuration.'));
    return Q.reject();
  }

  hasPort = config.server && (config.server.port === 0 || !!config.server.port);
  hasSocket = config.server && !!config.server.socket;

  // Check for valid server host and port values
  if (!config.server || !(hasPort || hasSocket)) {
    errors.logError(new Error('Your server values (socket or port) in config.js are invalid. \n' + JSON.stringify(config.server)));
    return Q.reject();
  }

  // Check for logging values and provide defaults if there are none
  if (!config.server.logging) {
    config.server.logging = {
      default: bunyan.createLogger({
        name: 'server',
        streams: [
          {
            level: 'trace',
            stream: process.stdout
          },
          {
            level: 'info',
            path: './log/earnest.api.server.log'
          }
        ]
      }),
      audit: bunyan.createLogger({
        name: 'audit',
        streams: [
          {
            level: 'info',
            stream: process.stdout
          },
          {
            level: 'info',
            path: './log/earnest.api.audit.log'
          }
        ]
      })
    };
  }

  return Q.resolve();
}

exports.loadConfig = function () {
  var loaded = Q.defer();

  // Check for config file and copy from config.example.js
  // if one doesn't exist. After that, start the server.
  fs.exists(config, function checkConfig(configExists) {
    if (configExists) {
      validateConfigEnvironment().then(loaded.resolve).fail(loaded.reject);
    } else {
      writeConfigFile().then(validateConfigEnvironment).then(loaded.resolve).fail(loaded.reject);
    }
  });
  return loaded.promise;
};