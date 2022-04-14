import {SessionAgentType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserQueries from '../../user/UserQueries';
import {extractCollaborator} from '../extractCollaborator';
import updateCollaboratorPresets from './handler';
import {IUpdateCollaboratorPresetsEndpointParams} from './types';

/**
 * TODO:
 * - Test that hanlder fails if preset doesn't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaborator presets updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IUpdateCollaboratorPresetsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        collaboratorId: user.resourceId,
        presets: [
          {
            presetId: preset01.resourceId,
            order: 1,
          },
          {
            presetId: preset02.resourceId,
            order: 2,
          },
        ],
      }
    );

  const result = await updateCollaboratorPresets(context, instData);
  assertEndpointResultOk(result);

  const updatedCollaborator = await extractCollaborator(
    context,
    await context.data.user.assertGetItem(UserQueries.getById(user.resourceId)),
    workspace.resourceId
  );

  expect(updatedCollaborator).toMatchObject(result.collaborator);
  expect(updatedCollaborator.presets).toBeTruthy();
  expect(updatedCollaborator.presets.length).toBeGreaterThan(0);
  expect(updatedCollaborator.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(updatedCollaborator.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
