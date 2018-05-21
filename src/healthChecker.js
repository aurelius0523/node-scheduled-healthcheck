import fs from 'fs';
import https from 'https';
import _ from 'lodash';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { services } from './endpoints';
const io = require('socket.io')().listen(5453);

let urlToHealthStatus = new Map();
const cronStartDate = new Date();

/**
 * Scheduler runs the job every minute from 9am to 6pm on weekdays
 */
cron.schedule(
  '* */1 9-18 * * 1-5',
  () => {
    services.map(service => {
      putUrlInMap(service.url);

      fetch(service.url, generateMeta(service))
        .then(res => isHttpStatusValid(res))
        .then(json => isResponseValid(json, service.successCriteriaCallback))
        .then(result => processResult(result, urlToHealthStatus, service.url))
        .catch(e => handleException(urlToHealthStatus, e.message, service.url))
        .then(writeResultToFile(urlToHealthStatus))
        .then(urlToHealthStatus => convertToResponse(urlToHealthStatus))
        .then(response => sendMessage('healthcheck', response));
    });
  },
  true
);

/**
 * Service object holds the information required to make requests to an URL,
 * such as headers, methods, url and requestBody
 * @param {Object} service
 */
function generateMeta(service) {
  return {
    method: service.method,
    headers: service.headers,
    body: service.method === ('POST' || 'PUT') ? service.requestBody : null,
    agent: new https.Agent({
      rejectUnauthorized: false
    })
  };
}

/**
 * Returns json if the httpStatus returned by this response is within 2xx range,
 * throws Error otherwise
 * @param {Object} res
 */
function isHttpStatusValid(res) {
  // console.log(`${url} has httpStatus ${res.status}`);
  if (!res.status.toString().match(/^2[0-9][0-9]/)) {
    throw new Error(`Http status returned is ${res.status}`);
  } else {
    return res.json();
  }
}

/**
 * Evaluates if the response body (json) returned is valid using successCriteriaCallback.
 * Any response body is considered valid if no successCriteriaCallback is passed in
 * @param {Object} json
 * @param {Function} successCriteriaCallback
 */
function isResponseValid(json, successCriteriaCallback) {
  // console.log(`${JSON.stringify(json)} is ${successCriteriaCallback(json)}`);
  if (!successCriteriaCallback) {
    return {
      isValid: true
    };
  } else {
    return {
      isValid: successCriteriaCallback(json),
      message: json
    };
  }
}

/**
 * Decides whether to increase the uptime or downtime of urlToHealthStatusObject.
 * @param {Object} urlToHealthStatus
 * @param {String} url
 */
function processResult(result, urlToHealthStatus, url) {
  let healthStatus = urlToHealthStatus.get(url);
  if (result && result.isValid) {
    healthStatus.uptime += 1;
  } else {
    healthStatus = processError(healthStatus, result.message);
  }
  urlToHealthStatus.set(url, healthStatus);

  return urlToHealthStatus;
}

/**
 * Calls processError function. Turned into a function to make main promise
 * more readable
 * @param {Object} urlToHealthStatus
 * @param {String} message
 * @param {String} url
 */
function handleException(urlToHealthStatus, message, url) {
  let healthStatus = urlToHealthStatus.get(url);
  urlToHealthStatus.set(url, processError(healthStatus, message));

  return urlToHealthStatus;
}

/**
 * Increases downtime in healthStatus object and calls processErrorMessageToDowntime()
 * in order to group total downtime by error returned by response
 * @param {Object} healthStatus
 * @param {String} message
 */
function processError(healthStatus, message) {
  let clonedHealthStatus = _.cloneDeep(healthStatus);
  clonedHealthStatus.downtime += 1;
  clonedHealthStatus.errorMessageToDowntime = processErrorMessageToDowntime(
    clonedHealthStatus.errorMessageToDowntime,
    message
  );
  return clonedHealthStatus;
}

/**
 * Counts the downtime of each error message and store it in a map.
 * Error message will be the key while the total downtime will
 * be the value
 * @param {Map} errorMessageToDowntime
 * @param {String} errorMessage
 */
function processErrorMessageToDowntime(errorMessageToDowntime, errorMessage) {
  let clonedErrorMessageToDowntime = _.cloneDeep(errorMessageToDowntime);
  let downtime = clonedErrorMessageToDowntime.get(errorMessage);
  if (!downtime) {
    clonedErrorMessageToDowntime.set(errorMessage, 1);
  } else {
    clonedErrorMessageToDowntime.set(errorMessage, downtime + 1);
  }
  return clonedErrorMessageToDowntime;
}

/**
 * Writes the result of the health check into a file at directory root.
 * If file is not present, a text file with name health.[yyyy-mm-dd].txt will
 * be created. The file is recreated on each cron trigger.
 * @param {Map} urlToHealthStatus
 */
function writeResultToFile(urlToHealthStatus) {
  let clonedUrlToHealthStatus = _.cloneDeep(urlToHealthStatus);
  let stringToWrite = `Started at: ${cronStartDate}\n\n`;

  clonedUrlToHealthStatus.forEach((value, key, map) => {
    value.errorMessageToDowntime = [...value.errorMessageToDowntime];
    let healthStatus = JSON.stringify(value, null, 2);

    stringToWrite += `${key} : ${healthStatus}\n\ntotal uptime (in hours) : ${(
      Number.parseInt(value.uptime) / 60
    ).toFixed(2)}\ntotal downtime (in hours) : ${(
      Number.parseInt(value.downtime) / 60
    ).toFixed(2)}\n\n`;
  });

  stringToWrite += `Ended at: ${new Date()}`;

  let fileName = `./health.${cronStartDate.toISOString().split('T')[0]}.txt`;
  fs.writeFile(fileName, stringToWrite, { flag: 'w' }, err => {
    if (err) console.error(err);
  });

  return clonedUrlToHealthStatus;
}

/**
 * Adds key and value to a global Map that is used to keep track of this job.
 * Map(url, healthStatus) which means healthStatus of every url will be kept track
 * in this map
 * @param {String} url
 */
function putUrlInMap(url) {
  if (!urlToHealthStatus.get(url)) {
    urlToHealthStatus.set(url, {
      uptime: 0,
      downtime: 0,
      errorMessageToDowntime: new Map()
    });
  }
}

/**
 * Converts urlToHealthCheck into a more meaningful format for client
 * consumption. This method needs to be modified if any field in
 * urlToHealthCheck status is changed
 * @param {Object} obj
 */
function convertToResponse(obj) {
  const clonedObj = _.cloneDeep(obj);
  const response = {
    urls: []
  };

  obj.forEach((value, key) => {
    const clonedHealthCheckModel = {};
    clonedHealthCheckModel.url = key;
    clonedHealthCheckModel.uptime = value.uptime;
    clonedHealthCheckModel.downtime = value.downtime;

    const errorMessageToDowntimeArray = [];
    value.errorMessageToDowntime.forEach((value, key) => {
      const clonedErrorMessageToDowntimeModel = {};
      clonedErrorMessageToDowntimeModel.message = key;
      clonedErrorMessageToDowntimeModel.downtime = value;
      errorMessageToDowntimeArray.push(clonedErrorMessageToDowntimeModel);
    });
    clonedHealthCheckModel.errorMessageToDowntime = errorMessageToDowntimeArray;
    response.urls.push(clonedHealthCheckModel);
  });

  return JSON.stringify(response);
}

/**
 * Emits message to a particular event
 * @param {String} response
 */
function sendMessage(event, response) {
  console.log(JSON.stringify(response));
  io.emit(event, response);
}
