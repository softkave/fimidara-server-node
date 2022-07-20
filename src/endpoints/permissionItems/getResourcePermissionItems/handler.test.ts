import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import addPermissionItems from '../addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../addItems/types';
import getEntityPermissionItems from './handler';
import {IGetResourcePermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const inputItems: INewPermissionItemInput[] = getWorkspaceActionList().map(
      action => ({
        action: action as BasicCRUDActions,
        grantAccess: faker.datatype.boolean(),
        appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
        itemResourceType: AppResourceType.Workspace,
        permissionEntityId: permissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        itemResourceId: workspace.resourceId,
      })
    );

    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId}
      );

    const addPermissionItemsResult = await addPermissionItems(
      context,
      addPermissionItemsReqData
    );

    const items = addPermissionItemsResult.items;
    const instData =
      RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          workspaceId: workspace.resourceId,
          itemResourceType: AppResourceType.Workspace,
          itemResourceId: workspace.resourceId,
        }
      );

    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
  });
});
