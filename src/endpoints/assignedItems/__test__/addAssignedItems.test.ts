import {identity} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {extractResourceIdList, makeKey} from '../../../utils/fns.js';
import {makeUserSessionAgent} from '../../../utils/sessionUtils.js';
import {
  assignPgListToIdList,
  toAssignedPgListInput,
} from '../../permissionGroups/testUtils.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testHelpers/generate/permissionGroup.js';
import {expectContainsEveryItemInForAnyType} from '../../testHelpers/helpers/assertion.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';
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
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02] =
      await Promise.all([
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

    const assignedItems = await kIjxSemantic.utils().withTxn(opts =>
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
      identity
    );

    const savedItems = await kIjxSemantic.assignedItem().getManyByQuery({
      assigneeId: {$in: pgList01IdList},
    });
    expectContainsEveryItemInForAnyType(
      savedItems,
      pgListAssignedTo02Input.concat(pgListAssignedTo01Input),
      pgAssignedItemKey,
      identity
    );
  });
});

const pgAssignedItemKey = (item: AssignedItem) =>
  makeKey([item.assignedItemId]);
