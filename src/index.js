import cron from 'node-cron';
import fetch from 'node-fetch';
import { services } from './endpoints';
import fs from 'fs';
import https from 'https';

let urlToStatus = new Map();

const startDate = new Date();
let id = 0;
cron.schedule('* * * * * *', () => {
  urlToStatus.forEach((value, key, map) => {
    console.log(`${id}: ${key} : ${JSON.stringify(value, null, 2)}`);
  });
  services.map(service => {
    putUrlInMap(service.url);
    fetch(service.url, {
      method: service.method,
      headers: {
        Authorization: 'Basic ' + service.authorization,
        'Content-Type': 'application/json'
      },
      body: service.method === 'POST' ? service.requestBody : null,
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
      .then(res => isHttpStatusValid(id, service.url, res))
      .then(json => isResponseValid(id, json, service.successCriteriaCallback))
      .then(isValid => {
        let status = urlToStatus.get(service.url);
        urlToStatus.set(
          service.url,
          increaseSuccessOrFailMinutes(id, isValid, status)
        );
      })
      .catch(e => {
        console.log(e.message);
        let status = increaseFailedMinutes(id, urlToStatus.get(service.url));
        urlToStatus.set(service.url, status);
      });
  });
  id++;
  writeResultToFile(urlToStatus);
});

function writeResultToFile(urlToStatus) {
  let stringToWrite = `Started at: ${startDate}\n\n`;

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

function isHttpStatusValid(id, url, res) {
  if (!res.status.toString().match(/^2[0-9][0-9]/)) {
    console.log(`${id} http status invalid`);
    throw new Error(`Http status returned for ${url} is ${res.status}`);
  } else {
    console.log(`${id} http status valid`);
    return res.json();
  }
}

function isResponseValid(id, json, successCriteriaCallback) {
  console.log(`${id} sucessCriteria ${successCriteriaCallback(json)}`);

  if (!successCriteriaCallback) {
    return true;
  }

  return successCriteriaCallback(json);
}

function increaseSuccessOrFailMinutes(id, isValid, status) {
  if (isValid) {
    console.log(`${id} is valid!`);
    increaseSuccessfulMinutes(id, status);
  } else {
    console.log(`${id} is invalid!`);
    increaseFailedMinutes(id, status);
  }
}

function increaseSuccessfulMinutes(id, status) {
  status.successfulMinutes += 1;
  console.log(`${id}: increase: ${JSON.stringify(status)}`);
  return status;
}

function increaseFailedMinutes(id, status) {
  status.failedMinutes += 1;
  console.log(`${id}: decrease: ${JSON.stringify(status)}`);
  return status;
}
