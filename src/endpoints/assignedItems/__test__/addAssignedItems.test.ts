import {AssignedItem} from '../../../definitions/assignedItem.js';
import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups.js';
import {extractResourceIdList, makeKey} from '../../../utils/fns.js';
import {makeUserSessionAgent} from '../../../utils/sessionUtils.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {test, expect, beforeAll, afterAll, describe} from 'vitest';
import {
  assignPgListToIdList,
  toAssignedPgListInput,
} from '../../permissionGroups/testUtils.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generate/permissionGroup.js';
import {expectContainsEveryItemInForAnyType} from '../../testUtils/helpers/assertion.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {addAssignedPermissionGroupList} from '../addAssignedItems.js';

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

    const assignedItems = await kSemanticModels.utils().withTxn(
      opts =>
        addAssignedPermissionGroupList(
          agent,
          workspace.resourceId,
          pgListAssignedTo02Input,
          pgList01IdList,
          false, // do not delete existing items
          true, // skip permission groups check
          false, // skip auth check
          opts
        ),
      /** reuseTxn */ true
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
