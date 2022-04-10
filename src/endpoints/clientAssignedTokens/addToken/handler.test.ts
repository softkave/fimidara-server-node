import {SessionAgentType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import {clientAssignedTokenExtractor} from '../utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('client assigned token added', async () => {
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

  const {token} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.resourceId,
    {
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

  const savedToken = await context.data.clientAssignedToken.assertGetItem(
    EndpointReusableQueries.getById(token.resourceId)
  );

  expect(clientAssignedTokenExtractor(savedToken)).toMatchObject(token);
  expect(token.presets).toHaveLength(2);
  expect(token.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(token.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});
