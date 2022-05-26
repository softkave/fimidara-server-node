import {faker} from '@faker-js/faker';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import addPermissionItems from '../addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../addItems/types';
import getEntityPermissionItems from './handler';
import {IGetResourcePermissionItemsEndpointParams} from './types';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {preset} = await insertPresetForTest(
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
        permissionEntityId: preset.resourceId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
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
