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
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateCollaborationRequest from './handler';
import {IUpdateCollaborationRequestEndpointParams, IUpdateCollaborationRequestInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('updateCollaborationRequest', () => {
  test('collaboration request updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const {permissionGroup: permissionGroup02} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionGroupsAssignedOnAcceptingRequest: [
          {permissionGroupId: permissionGroup01.resourceId},
        ],
      }
    );

    const updateCollaborationRequestInput: IUpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).valueOf(),
      permissionGroupsAssignedOnAcceptingRequest: [
        {permissionGroupId: permissionGroup02.resourceId},
      ],
    };

    const instData = RequestData.fromExpressRequest<IUpdateCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        requestId: request01.resourceId,
        request: updateCollaborationRequestInput,
      }
    );

    const result = await updateCollaborationRequest(context, instData);
    assertEndpointResultOk(result);
    const updatedRequest = await context.data.collaborationRequest.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(request01.resourceId)
    );

    expect(result.request.resourceId).toEqual(request01.resourceId);
    expect(result.request.message).toBe(updateCollaborationRequestInput.message);
    expect(result.request.expiresAt).not.toBe(request01.expiresAt);
    expect(updatedRequest.message).toBe(updateCollaborationRequestInput.message);
    expect(updatedRequest.expiresAt).not.toBe(request01.expiresAt);
    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      updatedRequest.resourceId,
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
    const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionGroupsAssignedOnAcceptingRequest: [
          {permissionGroupId: permissionGroup01.resourceId},
        ],
      }
    );

    const updateCollaborationRequestInput: IUpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).valueOf(),
      permissionGroupsAssignedOnAcceptingRequest: [],
    };

    const instData = RequestData.fromExpressRequest<IUpdateCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        requestId: request01.resourceId,
        request: updateCollaborationRequestInput,
      }
    );

    const result = await updateCollaborationRequest(context, instData);
    assertEndpointResultOk(result);
    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      result.request.resourceId,
      [AppResourceType.PermissionGroup]
    );

    expect(assignedItems.length).toBe(0);
  });

  test('permission groups not updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionGroupsAssignedOnAcceptingRequest: [
          {permissionGroupId: permissionGroup01.resourceId},
        ],
      }
    );

    const updateCollaborationRequestInput: IUpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).valueOf(),
    };

    const instData = RequestData.fromExpressRequest<IUpdateCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        requestId: request01.resourceId,
        request: updateCollaborationRequestInput,
      }
    );

    const result = await updateCollaborationRequest(context, instData);
    assertEndpointResultOk(result);
    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      result.request.resourceId,
      [AppResourceType.PermissionGroup]
    );

    expect(assignedItems.length).toBe(1);
    const assignedItem01 = assignedItems[0];
    expect(assignedItem01).toBeDefined();
    expect(assignedItem01.assignedItemId).toBe(permissionGroup01.resourceId);
  });
});
