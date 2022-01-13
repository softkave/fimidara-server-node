/**
 * TODO
 * - test for different entities, resource types, agents, owners, etc.
 */

import {
  AppResourceType,
  BasicCRUDActions,
} from '../../../../definitions/system';
import RequestData from '../../../RequestData';
import {
  getTestBaseContext,
  insertUserForTest,
  insertOrganizationForTest,
  insertFileForTest,
  mockExpressRequestWithUserToken,
} from '../../../test-utils/test-utils';
import {PermissionDeniedError} from '../../../user/errors';
import {
  checkAuthorization,
  getFilePermissionOwners,
} from '../checkAuthorizaton';

test('auth is granted when it should be', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId
  );

  const agent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
  );

  const permitted = await checkAuthorization(
    context,
    agent,
    organization.resourceId,
    file.resourceId,
    AppResourceType.File,
    getFilePermissionOwners(organization.resourceId, file),
    BasicCRUDActions.Read
  );

  expect(permitted).toBeTruthy();
});

test('auth fails when it should fail', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {userToken: userToken02} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId
  );

  const agent02 = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
  );

  const permitted = await checkAuthorization(
    context,
    agent02,
    organization.resourceId,
    file.resourceId,
    AppResourceType.File,
    getFilePermissionOwners(organization.resourceId, file),
    BasicCRUDActions.Read,
    true
  );

  expect(permitted).toBeFalsy();
});

test('should throw when noThrow is turned off', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {userToken: userToken02} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId
  );

  const agent02 = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
  );

  try {
    await checkAuthorization(
      context,
      agent02,
      organization.resourceId,
      file.resourceId,
      AppResourceType.File,
      getFilePermissionOwners(organization.resourceId, file),
      BasicCRUDActions.Read,
      false
    );
  } catch (error: any) {
    expect(error instanceof PermissionDeniedError).toBeTruthy();
  }
});
