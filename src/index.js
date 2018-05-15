import cron from 'node-cron';
import fetch from 'node-fetch';
import { services } from './endpoints';
import fs from 'fs';

let urlToStatus = new Map();

services.map(service => {
  putUrlInMap(service.url);
});

cron.schedule('* * * * *', () => {
  services.map(service => {
    fetch(service.url, {
      method: service.method,
      headers: {
        Authorization: 'Basic ' + service.authorization
      },
      body: service.method === 'POST' ? service.requestBody : null
    })
      .then(res => isHttpStatusValid(service.url, res))
      .then(json => isResponseValid(json, service.successCriteriaCallback))
      .then(isValid => {
        urlToStatus.set(
          service.url,
          increaseSuccessOrFailMinutes(
            isValid,
            urlToStatus.get(service.url),
            message
          )
        );
      })
      .catch(e => {
        urlToStatus.set(
          service.url,
          increaseFailedMinutes(urlToStatus.get(service.url))
        );
      });
  });

  writeResultToFile(urlToStatus);
});

function writeResultToFile(urlToStatus) {
  let stringToWrite = `Date started: ${new Date()}\n\n`;

  urlToStatus.forEach((value, key, map) => {
    stringToWrite += `${key} : ${JSON.stringify(value, null, 2)}\n\n`;
  });

  fs.writeFile('./result.txt', stringToWrite, { flag: 'w' }, function(err) {
    if (err) {
      return console.error(err);
    }
  });
}

function putUrlInMap(url) {
  if (!urlToStatus.get(url)) {
    urlToStatus.set(url, {
      successfulMinutes: 0,
      failedMinutes: 0
    });
  }
}

function isHttpStatusValid(url, res) {
  if (!res.status.toString().match(/^2[0-9][0-9]/)) {
    throw new Error(`Http status returned for ${url} is ${res.status}`);
  } else {
    return res.json();
  }
}

function isResponseValid(json, successCriteriaCallback) {
  return successCriteriaCallback(json);
}

function increaseSuccessOrFailMinutes(isValid, status) {
  if (isValid) {
    increaseSuccessfulMinutes(status);
  } else {
    increaseFailedMinutes(status);
  }
}

function increaseSuccessfulMinutes(status) {
  status.successfulMinutes += 1;
  return status;
}

function increaseFailedMinutes(status) {
  status.failedMinutes += 1;
  return status;
}
