import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {
  isActiveShardRunner,
  setActiveShardRunner,
  unsetActiveShardRunner,
} from '../utils.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('shardRunner utils', () => {
  test('setActiveShardRunner', () => {
    const queueKey = 'test' + Math.random();
    setActiveShardRunner({queueKey});
    expect(isActiveShardRunner({queueKey})).toBe(true);
  });

  test('unsetActiveShardRunner', () => {
    const queueKey = 'test' + Math.random();
    setActiveShardRunner({queueKey});
    expect(isActiveShardRunner({queueKey})).toBe(true);
    unsetActiveShardRunner({queueKey});
    expect(isActiveShardRunner({queueKey})).toBe(false);
  });
});
