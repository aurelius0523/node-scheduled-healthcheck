import { Base64 } from 'js-base64';

const LTDevUsername = 'blf';
const LTDevPassword = 'blf123';

export const services = Object.freeze([
  {
    url: 'https://api.github.com/users/github',
    method: 'GET',
    requestBody: '',
    successCriteriaCallback: validIfResponseBodyIsNotNull
  },
  {
    url: 'https://api.github.com/users/github',
    method: 'GET',
    requestBody: '',
    // authorization: Base64.encode(`${LTDevUsername}:${LTDevPassword}`),
    successCriteriaCallback: validIfResponseBodyIsNotNull
  }
]);

function validIfResponseBodyIsNotNull(json) {
  return JSON.stringify(json).includes('avatar_url');
}
