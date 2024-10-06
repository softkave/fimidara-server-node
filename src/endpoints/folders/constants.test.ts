import {uniq} from 'lodash-es';
import {loopAndCollate} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register.js';
import {completeTests} from '../testUtils/helpers/testFns.js';
import {initTests} from '../testUtils/testUtils.js';
import {kFolderConstants} from './constants.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('folders constants', () => {
  test('get queue key', () => {
    const queueCount = 4;
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      addFolderQueueCount: queueCount,
    });

    const f1 = 'rootname/aaaa/others';
    const f2 = 'rootname/aaab/others';
    const f3 = 'rootname/aaac/others';
    const f4 = 'rootname/aaad/others';

    const q1 = loopAndCollate(
      () => kFolderConstants.getAddFolderQueueKey(f1),
      /** count */ 10
    );
    const q2 = loopAndCollate(
      () => kFolderConstants.getAddFolderQueueKey(f2),
      /** count */ 10
    );
    const q3 = loopAndCollate(
      () => kFolderConstants.getAddFolderQueueKey(f3),
      /** count */ 10
    );
    const q4 = loopAndCollate(
      () => kFolderConstants.getAddFolderQueueKey(f4),
      /** count */ 10
    );

    const eQ1 = kFolderConstants.getAddFolderQueueWithNo(0);
    const eQ2 = kFolderConstants.getAddFolderQueueWithNo(1);
    const eQ3 = kFolderConstants.getAddFolderQueueWithNo(2);
    const eQ4 = kFolderConstants.getAddFolderQueueWithNo(3);

    const uniqQ1 = uniq(q1);
    const uniqQ2 = uniq(q2);
    const uniqQ3 = uniq(q3);
    const uniqQ4 = uniq(q4);

    expect(uniqQ1).toEqual([eQ1]);
    expect(uniqQ2).toEqual([eQ2]);
    expect(uniqQ3).toEqual([eQ3]);
    expect(uniqQ4).toEqual([eQ4]);
  });
});
