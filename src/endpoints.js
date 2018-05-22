import { Base64 } from 'js-base64';

export const services = Object.freeze([]);

function validIfResponseBodyHasAvatarUrl(json) {
  return json.hasOwnProperty('avatar_url');
}

export default {
  validIfResponseBodyHasAvatarUrl
};
