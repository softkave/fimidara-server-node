import {AssignedItem} from '../../../definitions/assignedItem';
import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {extractResourceIdList, makeKey} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {assignPgListToIdList, toAssignedPgListInput} from '../../permissionGroups/testUtils';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {expectContainsEveryItemInForAnyType} from '../../testUtils/helpers/assertion';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {addAssignedPermissionGroupList} from '../addAssignedItems';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
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
    const agent = makeUserSessionAgent(rawUser, userToken);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    await assignPgListToIdList(
      context,
      agent,
      workspace.resourceId,
      pgList01IdList,
      pgListAssignedTo01Input
    );

    const assignedItems = await executeWithMutationRunOptions(context, opts =>
      addAssignedPermissionGroupList(
        context!,
        agent,
        workspace.resourceId,
        pgListAssignedTo02Input,
        pgList01IdList,
        false, // do not delete existing items
        true, // skip permission groups check
        false, // skip auth check
        opts
      )
    );
    expectContainsEveryItemInForAnyType(
      assignedItems,
      pgListAssignedTo02Input,
      pgAssignedItemKey,
      pgInputKey
    );

    const savedItems = await context.semantic.assignedItem.getManyByQuery({
      assigneeId: {$in: pgList01IdList},
    });
    expectContainsEveryItemInForAnyType(
      savedItems,
      pgListAssignedTo02Input.concat(pgListAssignedTo01Input),
      pgAssignedItemKey,
      pgInputKey
    );
  });
});

const pgAssignedItemKey = (item: AssignedItem) => makeKey([item.assignedItemId]);
const pgInputKey = (item: AssignPermissionGroupInput) => makeKey([item.permissionGroupId]);
