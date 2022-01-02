import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import UserQueries from '../../user/UserQueries';
import {getCollaboratorOrganization} from '../utils';
import updateCollaboratorPresets from './handler';
import {IUpdateCollaboratorPresetsParams} from './types';

/**
 * TODO:
 * - Test that hanlder fails if preset doesn't exist
 */

test('collaborator presets updated', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IUpdateCollaboratorPresetsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      collaboratorId: user.userId,
      presets: [
        {
          presetId: preset01.presetId,
          order: 1,
        },
        {
          presetId: preset02.presetId,
          order: 2,
        },
      ],
    }
  );

  const result = await updateCollaboratorPresets(context, instData);
  assertEndpointResultHasNoErrors(result);

  const updatedUser = await context.data.user.assertGetItem(
    UserQueries.getById(user.userId)
  );
  const userOrgData = getCollaboratorOrganization(
    updatedUser,
    organization.organizationId
  );

  expect(updatedUser).toEqual(result.collaborator);
});
