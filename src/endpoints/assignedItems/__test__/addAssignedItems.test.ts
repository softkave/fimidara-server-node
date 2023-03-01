import {IAssignedItem} from '../../../definitions/assignedItem';
import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {extractResourceIdList, makeKey} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {IBaseContext} from '../../contexts/types';
import {assignPgListToIdList, toAssignedPgListInput} from '../../permissionGroups/testUtils';
import {cleanupContext} from '../../test-utils/context/cleanup';
import {generateAndInsertPermissionGroupListForTest} from '../../test-utils/generate-data/permissionGroup';
import {expectContainsExactlyForAnyType} from '../../test-utils/helpers/assertion';
import {
  assertContext,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {addAssignedPermissionGroupList} from '../addAssignedItems';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await cleanupContext(context);
});

describe('addAssignedItems', () => {
  test('addAssignedPermissionGroupList does not duplicate', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
    ]);
    const agent = makeUserSessionAgent(rawUser);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    await assignPgListToIdList(context, agent, workspace, pgList01IdList, pgListAssignedTo01Input);

    const assignedItems = await addAssignedPermissionGroupList(
      context,
      agent,
      workspace.resourceId,
      pgListAssignedTo02Input,
      pgList01IdList,
      false, // do not delete existing items
      true // skip permission groups check
    );
    expectContainsExactlyForAnyType(
      assignedItems,
      pgListAssignedTo02Input,
      pgAssignedItemKey,
      pgInputKey
    );

    const savedItems = await context.data.assignedItem.getManyByQuery({
      assignedToItemId: {$in: pgList01IdList},
    });
    expectContainsExactlyForAnyType(
      savedItems,
      pgListAssignedTo02Input.concat(pgListAssignedTo01Input),
      pgAssignedItemKey,
      pgInputKey
    );
  });

  test('addAssignedPermissionGroupList reassigns if order is changed', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
    ]);
    const agent = makeUserSessionAgent(rawUser);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    await Promise.all([
      assignPgListToIdList(context, agent, workspace, pgList01IdList, pgListAssignedTo01Input),
      assignPgListToIdList(context, agent, workspace, pgList01IdList, pgListAssignedTo02Input),
    ]);

    const assignedItems = await addAssignedPermissionGroupList(
      context,
      agent,
      workspace.resourceId,
      pgListAssignedTo02Input,
      pgList01IdList,
      false, // do not delete existing items
      true // skip permission groups check
    );
    expectContainsExactlyForAnyType(
      assignedItems,
      pgListAssignedTo02Input,
      pgAssignedItemKey,
      pgInputKey
    );

    const savedItems = await context.data.assignedItem.getManyByQuery({
      assignedToItemId: {$in: pgList01IdList},
    });
    expectContainsExactlyForAnyType(
      savedItems,
      pgListAssignedTo02Input.concat(pgListAssignedTo01Input),
      pgAssignedItemKey,
      pgInputKey
    );
  });
});

const pgAssignedItemKey = (item: IAssignedItem) => makeKey([item.assignedItemId]);
const pgInputKey = (item: IAssignPermissionGroupInput) => makeKey([item.permissionGroupId]);
