import {SessionAgentType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import UserQueries from '../../user/UserQueries';
import {getCollaboratorOrganization} from '../utils';
import updateCollaboratorPresets from './handler';
import {IUpdateCollaboratorPresetsParams} from './types';

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
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IUpdateCollaboratorPresetsParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
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

  const updatedUser = await context.data.user.assertGetItem(
    UserQueries.getById(user.resourceId)
  );

  expect(updatedUser).toMatchObject(result.collaborator);
  const userOrgData = getCollaboratorOrganization(
    updatedUser,
    organization.resourceId
  );

  expect(userOrgData?.presets).toBeTruthy();
  expect(userOrgData?.presets.length).toBeGreaterThan(0);
  expect(userOrgData?.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(userOrgData?.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
