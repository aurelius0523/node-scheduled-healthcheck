import assert from 'assert';
import all from '../src/endpoints.js';

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
