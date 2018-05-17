import cron from 'node-cron';
import fetch from 'node-fetch';
import { services } from './endpoints';
import fs from 'fs';
import https from 'https';
import _ from 'lodash';

let urlToHealthStatus = new Map();
const cronStartDate = new Date();

cron.schedule('* * * * * *', () => {
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
          ? (healthStatus.uptime += 1)
          : ((healthStatus.downtime += 1),
            healthStatus.failMessages.add(
              'successCriteriaCallback validation failed'
            ));
        urlToHealthStatus.set(service.url, healthStatus);
      })
      .catch(e => {
        let healthStatus = urlToHealthStatus.get(service.url);
        healthStatus.downtime += 1;
        healthStatus.failMessages.add(e.message);
        urlToHealthStatus.set(service.url, healthStatus);
      })
      .then(writeResultToFile(urlToHealthStatus));
  });
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
      Number.parseInt(value.uptime) / 60
    ).toFixed(2)}\ntotal downtime (in hours) : ${(
      Number.parseInt(value.downtime) / 60
    ).toFixed(2)}\n\n`;
  });

  stringToWrite += `Ended at: ${new Date()}`;

  let fileName = `./result.${cronStartDate.toISOString().split('T')[0]}.txt`;
  fs.writeFile(fileName, stringToWrite, { flag: 'w' }, err => {
    return console.error(err);
  });
}

function putUrlInMap(url) {
  if (!urlToHealthStatus.get(url)) {
    urlToHealthStatus.set(url, {
      uptime: 0,
      downtime: 0,
      failMessages: new Map()
    });
  }
}
