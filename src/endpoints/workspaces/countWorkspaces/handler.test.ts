import {faker} from '@faker-js/faker';
import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Workspace} from '../../../definitions/workspace.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generate/permissionItem.js';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {makeRootnameFromName} from '../utils.js';
import countWorkspacesEndpoint from './handler.js';
import {CountWorkspacesEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe.each([true, false])('countWorkspaces, sub=%s', isSubWorkspace => {
  let u1: Awaited<ReturnType<typeof insertUserForTest>> | undefined;
  let w1: Awaited<ReturnType<typeof insertWorkspaceForTest>> | undefined;

  const getW2Partial = (): Partial<Workspace> => {
    const wName = faker.company.name();
    const wRootname = makeRootnameFromName(wName);
    if (isSubWorkspace) {
      assert.ok(w1);
      return {
        name: wName,
        rootname: wRootname,
        rootnamepath: [w1.workspace.rootname, wRootname],
        description: faker.company.catchPhraseDescriptor(),
        workspaceId: w1.workspace.resourceId,
      };
    } else {
      return {
        name: wName,
        rootname: wRootname,
        rootnamepath: [wRootname],
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

  test('count', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const count = 15;
    const workspaces = await generateAndInsertWorkspaceListForTest(
      count,
      getW2Partial
    );
    await Promise.all(
      workspaces.map(w =>
        generateAndInsertPermissionItemListForTest(/** count */ 1, {
          entityId: w.resourceId,
          targetId: rawUser.resourceId,
          access: true,
          action: kFimidaraPermissionActions.readWorkspace,
        })
      )
    );

    const reqData =
      RequestData.fromExpressRequest<CountWorkspacesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: isSubWorkspace ? w1?.workspace.resourceId : undefined}
      );
    const result = await countWorkspacesEndpoint(reqData);

    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
