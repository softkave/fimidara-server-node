import {faker} from '@faker-js/faker';
import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register.js';
import {IRootLevelWorkspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import EndpointReusableQueries from '../../queries.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {
  assertWorkspace,
  makeRootnameFromName,
  workspaceExtractor,
} from '../utils.js';
import {NotFoundError, ResourceExistsError} from '../../errors.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe.each([true, false])('addWorkspace, sub=%s', isSubWorkspace => {
  let u1: Awaited<ReturnType<typeof insertUserForTest>> | undefined;
  let w1: Awaited<ReturnType<typeof insertWorkspaceForTest>> | undefined;

  const getW2Input = () => {
    const wName = faker.company.name();
    if (isSubWorkspace) {
      assert.ok(w1);
      return {
        name: wName,
        rootname: makeRootnameFromName(wName),
        description: faker.company.catchPhraseDescriptor(),
        workspaceId: w1.workspace.resourceId,
      };
    } else {
      return {
        name: wName,
        rootname: makeRootnameFromName(wName),
        description: faker.company.catchPhraseDescriptor(),
      };
    }
  };

  beforeAll(async () => {
    u1 = await insertUserForTest();
    if (isSubWorkspace) {
      w1 = await insertWorkspaceForTest(u1.userToken);
    }
  });

  test('workspace created', async () => {
    assert.ok(u1);
    const {userToken} = u1;
    const w2Input = getW2Input();

    const result = await insertWorkspaceForTest(userToken, w2Input);

    const rWorkspace = result.workspace as IRootLevelWorkspace;
    expect(rWorkspace).toMatchObject(w2Input);

    if (isSubWorkspace) {
      appAssert(w1);
      expect(rWorkspace.workspaceId).toEqual(w1.workspace.resourceId);
    } else {
      expect(rWorkspace.publicPermissionGroupId).toBeTruthy();
      expect(rWorkspace.workspaceId).toEqual(rWorkspace.resourceId);

      // check that the workspace was persisted and matches the input
      const workspace = await kSemanticModels
        .workspace()
        .getOneByQuery(
          EndpointReusableQueries.getByResourceId(rWorkspace.resourceId)
        );
      assertWorkspace(workspace);
      expect(workspaceExtractor(workspace)).toMatchObject(rWorkspace);
    }
  });

  test('fails if workspace name exists', async () => {
    assert.ok(u1);
    const {userToken} = u1;
    const w2Input = getW2Input();

    await insertWorkspaceForTest(userToken, w2Input);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, w2Input);
    }, [NotFoundError.name]);
  });

  test('fails if workspace root name exists', async () => {
    assert.ok(u1);
    const {userToken} = u1;
    const w2Input = getW2Input();

    await insertWorkspaceForTest(userToken, w2Input);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, w2Input);
    }, [ResourceExistsError.name]);
  });

  test('fails if user is on waitlist', async () => {
    kRegisterUtilsInjectables.suppliedConfig(
      mergeData(
        kUtilsInjectables.suppliedConfig(),
        /** source */ {FLAG_waitlistNewSignups: true},
        /** meta */ {arrayUpdateStrategy: 'replace'}
      )
    );
    assert.ok(u1);
    const {userToken} = u1;

    if (isSubWorkspace) {
      // should not fail because only root level workspaces are checked
      await insertWorkspaceForTest(userToken);
    } else {
      await expectErrorThrown(
        async () => {
          await insertWorkspaceForTest(userToken);
        },
        /** expected */ error => {
          expect((error as Error).message).toBe(
            kReuseableErrors.user.userOnWaitlist().message
          );
        },
        /** finally */ () => {
          // TODO: if we ever switch to concurrent tests, then create a context
          // for this test instead
          kRegisterUtilsInjectables.suppliedConfig(
            mergeData(
              kUtilsInjectables.suppliedConfig(),
              /** source */ {FLAG_waitlistNewSignups: false},
              /** meta */ {arrayUpdateStrategy: 'replace'}
            )
          );
        }
      );
    }
  });
});
