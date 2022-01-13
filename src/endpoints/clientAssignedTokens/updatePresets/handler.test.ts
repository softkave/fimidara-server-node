import {SessionAgentType} from '../../../definitions/system';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import updateClientAssignedTokenPresets from './handler';
import {IUpdateClientAssignedTokenPresetsParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if preset doesn't exist
 */

test('client assigned token presets updated', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId
  );

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

  const instData = RequestData.fromExpressRequest<IUpdateClientAssignedTokenPresetsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.resourceId,
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

  const result = await updateClientAssignedTokenPresets(context, instData);
  assertEndpointResultOk(result);

  const updatedToken = await context.data.clientAssignedToken.assertGetItem(
    EndpointReusableQueries.getById(token01.resourceId)
  );

  expect(updatedToken).toMatchObject(result.token);
  expect(updatedToken.presets.length).toEqual(2);
  expect(updatedToken.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(updatedToken.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
