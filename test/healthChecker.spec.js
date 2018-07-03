import assert from 'assert';
import all from '../src/endpoints.js';
import { isHttpStatusValid, isResponseValid } from '../src/healthChecker.js';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('Github API test', () => {
  it('should return true when avatar_url is found', () => {
    assert.equal(
      all.validIfResponseBodyHasAvatarUrl({ avatar_url: 'http://avatar.com' }),
      true
    );
  });

  it('should return false when avatar_url is not found', () => {
    assert.equal(
      all.validIfResponseBodyHasAvatarUrl({
        not_url: 'http://avatar.com'
      }),
      false
    );
  });

  it('should return false when not_avatar_url is present instead of avatar_url', () => {
    assert.equal(
      all.validIfResponseBodyHasAvatarUrl({
        not_avatar_url: 'http://avatar.com'
      }),
      false
    );
  });
});

describe('Steps taken to fetch process and submitting message to socket', () => {
  describe('Http status check', () => {
    let spiedIsHttpStatusValid = sandbox.spy(isHttpStatusValid);
    afterEach(() => {
      sandbox.restore();
    });

    it('should throw error when http status is not 2xx', () => {
      try {
        spiedIsHttpStatusValid({ status: 400 });
      } catch (e) {
        assert(spiedIsHttpStatusValid.threw('Error'));
      }
    });

    it('should return a json object if http status is 2xx', () => {
      let expectedResponse = {
        status: 203,
        json: () => {
          return JSON.parse('{"name":"kim"}');
        }
      };
      let returns = spiedIsHttpStatusValid(expectedResponse);

      sinon.assert.match(returns, expectedResponse.json);
    });
  });

  describe('Is response valid', () => {
    const json = '{"name":"kim"}';
    const successCriteriaCallback = () => {
      return JSON.parse(json).name == 'kim';
    };
    const spiedIsResponseValid = sinon.spy(isResponseValid);

    afterEach(() => {
      sandbox.restore();
    });

    it('should return true is successCriteriaCallback is truthy', () => {
      sinon.assert.match(spiedIsResponseValid(successCriteriaCallback), {
        isValid: true
      });
    });
  });
});
