import { Base64 } from 'js-base64';

export const services = Object.freeze([
  {
    url: 'https://blis-dev.alv.baltic.seb.net/LVLifeServices/customer/basic',
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
    headers: {
      Authorization: 'Basic ' + encodeBase64ForLVandLT(),
      'Content-Type': 'application/json'
    },
    successCriteriaCallback: validIfUnifiedServiceBodyIsPresent,
    errorMessageParserCallback: getErrorMessageFromUnifiedServiceError
  },
  {
    url: 'https://blis-dev.amg.baltic.seb.net/LTLifeServices/customer/basic',
    method: 'POST',
    requestBody: JSON.stringify({
      unifiedServiceHeader: {
        requestId: 'Rd18e5787-906d-4e40-b059-357ca95baea0',
        serviceName: '/customer/basic',
        userId: 'v20531',
        xsdBasedRequest: false,
        responseIsCompressed: false,
        clientApplication: 'BLF',
        countryCode: 'LT',
        language: 'lt',
        sessionKey: '2A1A205F6D9B74BFA74CBD7EC1B77377'
      },
      unifiedServiceBody: {
        any: [
          {
            bankCustomerId: '01951432'
          }
        ]
      }
    }),
    headers: {
      Authorization: 'Basic ' + encodeBase64ForLVandLT(),
      'Content-Type': 'application/json'
    },
    successCriteriaCallback: validIfUnifiedServiceBodyIsPresent,
    errorMessageParserCallback: getErrorMessageFromUnifiedServiceError
  },
  {
    url: 'https://blis.amg.baltic.seb.net/LTLifeServices/customer/basic',
    method: 'POST',
    requestBody: JSON.stringify({
      unifiedServiceHeader: {
        requestId: 'Rd18e5787-906d-4e40-b059-357ca95baea0',
        serviceName: '/customer/basic',
        userId: 'v20531',
        xsdBasedRequest: false,
        responseIsCompressed: false,
        clientApplication: 'BLF',
        countryCode: 'LT',
        language: 'lt',
        sessionKey: '2A1A205F6D9B74BFA74CBD7EC1B77377'
      },
      unifiedServiceBody: {
        any: [
          {
            bankCustomerId: '01951432'
          }
        ]
      }
    }),
    headers: {
      Authorization: 'Basic ' + encodeBase64ForLVandLT(),
      'Content-Type': 'application/json'
    },
    successCriteriaCallback: validIfUnifiedServiceBodyIsPresent,
    errorMessageParserCallback: getErrorMessageFromUnifiedServiceError
  }
]);

function encodeBase64ForLVandLT() {
  return Base64.encode('blf:blf123');
}

function validIfUnifiedServiceBodyIsPresent(json) {
  return json.hasOwnProperty('unifiedServiceBody');
}

function validIfResponseBodyHasAvatarUrl(json) {
  return json.hasOwnProperty('avatar_url');
}

function getErrorMessageFromUnifiedServiceError(json) {
  return json.unifiedServiceErrors.Error[0].errorMessage;
}
export default {
  validIfResponseBodyHasAvatarUrl
};
