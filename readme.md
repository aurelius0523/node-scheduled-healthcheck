# Scheduled Healthchecker

## Introduction

A small node utility to programatically check health status of APIs.

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
Started at: Wed May 16 2018 21:55:12 GMT+0800 (Malay Peninsula Standard Time)

https://api.github.com/users/github : {
  "successfulMinutes": 0,
  "failedMinutes": 7,
  "failMessages": [
    "Http status returned for https://api.github.com/users/github is 401"
  ]
}

total uptime (in hours) : 0.00
total downtime (in hours) : 0.12
```

## Usage

```
git clone https://github.com/aurelius0523/node-scheduled-healthcheck
cd node-scheduled-healthcheck
npm install
(update endpoints.js to include desired endpoints)
npm start
```
