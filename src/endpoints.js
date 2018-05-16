import { Base64 } from 'js-base64';

const LVDevUsername = 'blf';
const LVDevPassword = 'blf123';

export const services = Object.freeze([
  {
    url:
      'https://blis-sl-rd-app.unibanka.lv:9443/LVLifeServices/customer/basic',
    method: 'POST',
    requestBody: JSON.stringify({
      unifiedServiceHeader: {
        requestId: 'Re527820b-0c0b-4b66-a01d-74a4d72028dc',
        serviceName: '/customer/basic',
        userId: 'v20531',
        xsdBasedRequest: false,
        responseIsCompressed: false,
        clientApplication: 'BLF',
        countryCode: 'LV',
        language: 'lv',
        sessionKey: 'A52D79895EA2300D28FE9F649EE43A72'
      },
      unifiedServiceBody: {
        any: [
          {
            bankCustomerId: '01951432'
          }
        ]
      }
    }),
    authorization: encodeBase64ForLVDev(),
    successCriteriaCallback: validIfUnifiedServiceBodyIsPresent
  }
  // ,
  // {
  //   url: 'https://api.github.com/users/github',
  //   method: 'GET',
  //   requestBody: '',
  //   // authorization: Base64.encode(`${LTDevUsername}:${LTDevPassword}`),
  //   successCriteriaCallback: validIfResponseBodyIsNotNull
  // }
]);

function encodeBase64ForLVDev() {
  return Base64.encode(`${LVDevUsername}:${LVDevPassword}`);
}

function validIfUnifiedServiceBodyIsPresent(json) {
  return JSON.stringify(json).includes('unifiedServiceBody');
}

function validIfResponseBodyIsNotNull(json) {
  return JSON.stringify(json).includes('avatar_url');
}
