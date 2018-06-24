# Scheduled Healthchecker

## Introduction

A small node utility to check health status of APIs.

`endpoints.js` exports `services` where services that needs to be healthchecked are defined with the following parameters. Scheduling is handled using [node-cron](https://github.com/kelektiv/node-cron/ 'Github page') and data fetching is done using [node-fetch](https://github.com/bitinn/node-fetch 'Github page')

```javascript
export const services = Object.freeze([
  {
    url: 'https://api.github.com/users/github',
    method: 'GET',
    requestBody: '',
    headers: {
      Authorization: 'Basic ' + encodeBase64(),
      'Content-Type': 'application/json'
    },
    successCriteriaCallback: validIfResponseBodyHasAvatarUrl
  }
]);
```

A text file will be generated at the root of the application at every interval to show the outcome of the healthcheck.

```text
https://api.github.com/users/github : {
  "uptime": 0,
  "downtime": 6,
  "errorMessageToDowntime": [
    [
      "Http status returned is 401",
      6
    ]
  ]
}

total uptime (in hours) : 0.00
total downtime (in hours) : 0.10

Ended at: Fri May 18 2018 00:59:32 GMT+0800 (Malay Peninsula Standard Time)
```

## Usage

```
git clone https://github.com/aurelius0523/node-scheduled-healthcheck
cd node-scheduled-healthcheck
npm install
(update endpoints.js to include desired endpoints)
npm start
```

## Libraries Used

1.  Code Coverage - Istanbul/nyc
2.  Unit Testing - Mocha/Chai/Expect/Sinon
3.  Fetch API - node-fetch
4.  Scheduler - node-cron
5.  Transpiler - babel
6.  Socket - socket.io
7.  Utility - lodash
