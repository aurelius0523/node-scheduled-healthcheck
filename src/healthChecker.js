import cron from 'node-cron';
import fetch from 'node-fetch';
import { services } from './endpoints';
import fs from 'fs';
import https from 'https';
import _ from 'lodash';

let urlToHealthStatus = new Map();
const cronStartDate = new Date();

cron.schedule('* * * * *', () => {
  services.map(service => {
    putUrlInMap(service.url);
    fetch(service.url, {
      method: service.method,
      headers: service.headers,
      body: service.method === ('POST' || 'PUT') ? service.requestBody : null,
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
      .then(res => isHttpStatusValid(service.url, res))
      .then(json => isResponseValid(json, service.successCriteriaCallback))
      .then(isValid => {
        let healthStatus = urlToHealthStatus.get(service.url);
        isValid
          ? (healthStatus.successfulMinutes += 1)
          : ((healthStatus.failedMinutes += 1),
            healthStatus.failMessages.add(
              'successCriteriaCallback validation failed'
            ));
        urlToHealthStatus.set(service.url, healthStatus);
      })
      .catch(e => {
        let healthStatus = urlToHealthStatus.get(service.url);
        healthStatus.failedMinutes += 1;
        healthStatus.failMessages.add(e.message);
        urlToHealthStatus.set(service.url, healthStatus);
      });
  });
  writeResultToFile(urlToHealthStatus);
});

function isHttpStatusValid(url, res) {
  // console.log(`${url} has httpStatus ${res.status}`);
  if (!res.status.toString().match(/^2[0-9][0-9]/)) {
    throw new Error(`Http status returned for ${url} is ${res.status}`);
  } else {
    return res.json();
  }
}

function isResponseValid(json, successCriteriaCallback) {
  // console.log(`${JSON.stringify(json)} is ${successCriteriaCallback(json)}`);
  if (!successCriteriaCallback) {
    return true;
  }
  return successCriteriaCallback(json);
}

function writeResultToFile(urlToHealthStatus) {
  let clonedUrlToHealthStatus = _.cloneDeep(urlToHealthStatus);
  let stringToWrite = `Started at: ${cronStartDate}\n\n`;

  clonedUrlToHealthStatus.forEach((value, key, map) => {
    value.failMessages = [...value.failMessages];
    let healthStatus = JSON.stringify(value, null, 2);

    stringToWrite += `${key} : ${healthStatus}\n\ntotal uptime (in hours) : ${(
      Number.parseInt(value.successfulMinutes) / 60
    ).toFixed(2)}\ntotal downtime (in hours) : ${(
      Number.parseInt(value.failedMinutes) / 60
    ).toFixed(2)}\n\n`;
  });

  fs.writeFile('./result.txt', stringToWrite, { flag: 'w' }, function(err) {
    if (err) {
      return console.error(err);
    }
  });
}

function putUrlInMap(url) {
  if (!urlToHealthStatus.get(url)) {
    urlToHealthStatus.set(url, {
      successfulMinutes: 0,
      failedMinutes: 0,
      failMessages: new Set()
    });
  }
}
