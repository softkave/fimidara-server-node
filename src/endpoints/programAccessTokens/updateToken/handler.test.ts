import * as faker from 'faker';
import {SessionAgentType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import ClientAssignedTokenQueries from '../queries';
import {programAccessTokenExtractor} from '../utils';
import updateProgramAccessToken from './handler';
import {IUpdateProgramAccessTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if presets doesn't exist
 * - [Low] Test that onReferenced feature works
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('program access token updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
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

  const tokenUpdateInput = {
    name: faker.lorem.words(3),
    description: faker.lorem.words(10),
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
  };

  const instData =
    RequestData.fromExpressRequest<IUpdateProgramAccessTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tokenId: token01.resourceId,
        token: tokenUpdateInput,
      }
    );

  const result = await updateProgramAccessToken(context, instData);
  assertEndpointResultOk(result);

  const updatedToken = await context.data.programAccessToken.assertGetItem(
    ClientAssignedTokenQueries.getById(token01.resourceId)
  );

  expect(programAccessTokenExtractor(updatedToken)).toMatchObject(result.token);
  expect(updatedToken.name).toBe(tokenUpdateInput.name);
  expect(updatedToken.description).toBe(tokenUpdateInput.description);
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
