import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {collaboratorExtractor} from '../utils.js';
import getCollaborator from './handler.js';
import {GetCollaboratorEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('collaborator returned', async () => {
  const {userToken, user} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const reqData = RequestData.fromExpressRequest<GetCollaboratorEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {workspaceId: workspace.resourceId, collaboratorId: user.resourceId}
  );

  const result = await getCollaborator(reqData);
  assertEndpointResultOk(result);
  expect(result.collaborator).toMatchObject(
    collaboratorExtractor(
      await populateUserWorkspaces(
        await kIjxSemantic
          .user()
          .assertGetOneByQuery({resourceId: user.resourceId})
      ),
      workspace.resourceId
    )
  );
});
