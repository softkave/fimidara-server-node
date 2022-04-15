import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {clientAssignedTokenExtractor, getPublicClientToken} from '../utils';
import updateClientAssignedToken from './handler';
import {IUpdateClientAssignedTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if preset doesn't exist
 * - Test updating other fields
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('client assigned token presets updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

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
    RequestData.fromExpressRequest<IUpdateClientAssignedTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token01.resourceId,
        token: {
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
        },
      }
    );

  const result = await updateClientAssignedToken(context, instData);
  assertEndpointResultOk(result);
  const updatedToken = getPublicClientToken(
    context,
    await withAssignedPresetsAndTags(
      context,
      workspace.resourceId,
      await context.data.clientAssignedToken.assertGetItem(
        EndpointReusableQueries.getById(token01.resourceId)
      ),
      AppResourceType.ClientAssignedToken
    )
  );

  expect(clientAssignedTokenExtractor(updatedToken)).toMatchObject(
    result.token
  );

  expect(result.token.presets.length).toEqual(2);
  expect(result.token.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(result.token.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
