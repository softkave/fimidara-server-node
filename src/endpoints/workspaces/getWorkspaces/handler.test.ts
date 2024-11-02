import {faker} from '@faker-js/faker';
import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {Workspace} from '../../../definitions/workspace.js';
import {calculatePageSize, getResourceId} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generate/permissionItem.js';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace.js';
import {expectContainsNoneIn} from '../../testUtils/helpers/assertion.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {NewWorkspaceInput} from '../addWorkspace/types.js';
import {makeRootnameFromName} from '../utils.js';
import getWorkspacesEndpoint from './handler.js';
import {GetWorkspacesEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe.each([true, false])('getWorkspaces, sub=%s', isSubWorkspace => {
  let u1: Awaited<ReturnType<typeof insertUserForTest>> | undefined;
  let w1: Awaited<ReturnType<typeof insertWorkspaceForTest>> | undefined;

  const getW2Input = (): NewWorkspaceInput => {
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

  test('user workspaces are returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace: workspace01} = await insertWorkspaceForTest(
      userToken,
      getW2Input()
    );
    const {workspace: workspace02} = await insertWorkspaceForTest(
      userToken,
      getW2Input()
    );
    const {workspace: workspace03} = await insertWorkspaceForTest(
      userToken,
      getW2Input()
    );

    const reqData = RequestData.fromExpressRequest<GetWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      isSubWorkspace ? {workspaceId: w1?.workspace.resourceId} : {}
    );
    const result = await getWorkspacesEndpoint(reqData);

    assertEndpointResultOk(result);
    expect(result.workspaces).toHaveLength(3);
    expect(result.workspaces).toContainEqual(workspace01);
    expect(result.workspaces).toContainEqual(workspace02);
    expect(result.workspaces).toContainEqual(workspace03);
  });

  test('pagination', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const count = 15;
    const workspaces = await generateAndInsertWorkspaceListForTest(
      15,
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

    const pageSize = 10;
    let page = 0;
    let reqData = RequestData.fromExpressRequest<GetWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: isSubWorkspace ? w1?.workspace.resourceId : undefined,
      }
    );
    const result00 = await getWorkspacesEndpoint(reqData);

    assertEndpointResultOk(result00);
    expect(result00.page).toBe(page);
    expect(result00.workspaces).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    reqData = RequestData.fromExpressRequest<GetWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize}
    );
    const result01 = await getWorkspacesEndpoint(reqData);

    assertEndpointResultOk(result01);
    expectContainsNoneIn(
      result00.workspaces,
      result01.workspaces,
      getResourceId
    );
    expect(result01.page).toBe(page);
    expect(result01.workspaces).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
