import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import ClientAssignedTokenQueries from '../queries';
import updateProgramAccessToken from './handler';
import {IUpdateProgramAccessTokenParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if presets doesn't exist
 * - [Low] Test that onReferenced feature works
 */

test('program access token updated', async () => {
  const context = getTestBaseContext();
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
    name: faker.lorem.sentence(20),
    description: faker.lorem.sentence(50),
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

  const instData = RequestData.fromExpressRequest<IUpdateProgramAccessTokenParams>(
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

  expect(updatedToken).toMatchObject(result.token);
  expect(updatedToken.name).toMatchObject(tokenUpdateInput.name);
  expect(updatedToken.description).toMatchObject(tokenUpdateInput.description);
  expect(updatedToken.presets.length).toBe(2);
  expect(updatedToken.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: user.resourceId,
    order: 0,
  });
  expect(updatedToken.presets[0]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: user.resourceId,
    order: 1,
  });
});
