import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {populateRequestPermissionGroups} from '../utils';
import {ICollaborationRequestInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('sendRequest', () => {
  test('collaboration request sent', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {user: user02} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const requestInput: ICollaborationRequestInput = {
      recipientEmail: user02.email,
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).toISOString(),
      permissionGroupsOnAccept: [
        {
          permissionGroupId: permissionGroup.resourceId,
          order: 0,
        },
      ],
    };

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      requestInput
    );

    const assignedPermissionGroup01 = request01.permissionGroupsOnAccept[0];
    expect(assignedPermissionGroup01).toBeDefined();
    expect(assignedPermissionGroup01.permissionGroupId).toBe(
      permissionGroup.resourceId
    );

    const savedRequest = await context.data.collaborationRequest.assertGetItem(
      EndpointReusableQueries.getById(request01.resourceId)
    );

    expect(request01).toMatchObject(
      await populateRequestPermissionGroups(context, savedRequest)
    );

    expect(
      savedRequest.statusHistory[savedRequest.statusHistory.length - 1]
    ).toMatchObject({
      status: CollaborationRequestStatusType.Pending,
    });
  });
});
