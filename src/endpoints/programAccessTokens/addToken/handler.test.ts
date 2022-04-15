import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import ProgramAccessTokenQueries from '../queries';
import {getPublicProgramToken, programAccessTokenExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if token exists
 * [Low] - Test that hanlder fails if presets don't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('program access token added', async () => {
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

  const {token} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    workspace.resourceId,
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

  const savedToken = getPublicProgramToken(
    context,
    await withAssignedPresetsAndTags(
      context,
      workspace.resourceId,
      await context.data.programAccessToken.assertGetItem(
        ProgramAccessTokenQueries.getById(token.resourceId)
      ),
      AppResourceType.ProgramAccessToken
    )
  );

  expect(programAccessTokenExtractor(savedToken)).toMatchObject(token);
  expect(token.presets.length).toEqual(2);
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
