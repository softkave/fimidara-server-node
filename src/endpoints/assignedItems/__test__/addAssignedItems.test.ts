import {AssignedItem} from '../../../definitions/assignedItem';
import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {extractResourceIdList, makeKey} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {kSemanticModels} from '../../contexts/injectables';
import {
  assignPgListToIdList,
  toAssignedPgListInput,
} from '../../permissionGroups/testUtils';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {expectContainsEveryItemInForAnyType} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/test';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {addAssignedPermissionGroupList} from '../addAssignedItems';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addAssignedItems', () => {
  test('addAssignedPermissionGroupList does not duplicate', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    await assignPgListToIdList(
      agent,
      workspace.resourceId,
      pgList01IdList,
      pgListAssignedTo01Input
    );

    const assignedItems = await kSemanticModels.utils().withTxn(opts =>
      addAssignedPermissionGroupList(
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

    const savedItems = await kSemanticModels.assignedItem().getManyByQuery({
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
const pgInputKey = (item: AssignPermissionGroupInput) =>
  makeKey([item.permissionGroupId]);
