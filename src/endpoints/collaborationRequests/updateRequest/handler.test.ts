import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {AppResourceType} from '../../../definitions/system';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import updateRequest from './handler';
import {
  IUpdateCollaborationRequestInput,
  IUpdateRequestEndpointParams,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('updateRequest', () => {
  test('collaboration request updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup01} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const {permissionGroup: permissionGroup02} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionGroupsOnAccept: [
          {
            permissionGroupId: permissionGroup01.resourceId,
            order: 0,
          },
        ],
      }
    );

    const updateRequestInput: IUpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).toISOString(),
      permissionGroupsOnAccept: [
        {
          permissionGroupId: permissionGroup02.resourceId,
          order: 0,
        },
      ],
    };

    const instData =
      RequestData.fromExpressRequest<IUpdateRequestEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          requestId: request01.resourceId,
          request: updateRequestInput,
        }
      );

    const result = await updateRequest(context, instData);
    assertEndpointResultOk(result);
    const updatedRequest =
      await context.data.collaborationRequest.assertGetItem(
        EndpointReusableQueries.getById(request01.resourceId)
      );

    expect(result.request.resourceId).toEqual(request01.resourceId);
    expect(result.request.message).toBe(updateRequestInput.message);
    expect(result.request.expiresAt).not.toBe(request01.expiresAt);
    expect(updatedRequest.message).toBe(updateRequestInput.message);
    expect(updatedRequest.expiresAt).not.toBe(request01.expiresAt);
    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      updatedRequest.resourceId,
      AppResourceType.CollaborationRequest,
      [AppResourceType.PermissionGroup]
    );

    expect(assignedItems.length).toBe(1);
    const assignedItem01 = assignedItems[0];
    expect(assignedItem01).toBeDefined();
    expect(assignedItem01.assignedItemId).toBe(permissionGroup02.resourceId);
  });

  test('permission groups removed', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup01} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionGroupsOnAccept: [
          {
            permissionGroupId: permissionGroup01.resourceId,
            order: 0,
          },
        ],
      }
    );

    const updateRequestInput: IUpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).toISOString(),
      permissionGroupsOnAccept: [],
    };

    const instData =
      RequestData.fromExpressRequest<IUpdateRequestEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          requestId: request01.resourceId,
          request: updateRequestInput,
        }
      );

    const result = await updateRequest(context, instData);
    assertEndpointResultOk(result);
    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      result.request.resourceId,
      AppResourceType.CollaborationRequest,
      [AppResourceType.PermissionGroup]
    );

    expect(assignedItems.length).toBe(0);
  });

  test('permission groups not updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup01} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionGroupsOnAccept: [
          {
            permissionGroupId: permissionGroup01.resourceId,
            order: 0,
          },
        ],
      }
    );

    const updateRequestInput: IUpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).toISOString(),
    };

    const instData =
      RequestData.fromExpressRequest<IUpdateRequestEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          requestId: request01.resourceId,
          request: updateRequestInput,
        }
      );

    const result = await updateRequest(context, instData);
    assertEndpointResultOk(result);
    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      result.request.resourceId,
      AppResourceType.CollaborationRequest,
      [AppResourceType.PermissionGroup]
    );

    expect(assignedItems.length).toBe(1);
    const assignedItem01 = assignedItems[0];
    expect(assignedItem01).toBeDefined();
    expect(assignedItem01.assignedItemId).toBe(permissionGroup01.resourceId);
  });
});
