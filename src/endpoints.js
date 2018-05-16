import { Base64 } from 'js-base64';

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

function encodeBase64() {
  return Base64.encode('username:password');
}

function validIfResponseBodyHasAvatarUrl(json) {
  return json.hasOwnProperty('avatar_url');
}

export default {
  validIfResponseBodyHasAvatarUrl,
  encodeBase64
};
