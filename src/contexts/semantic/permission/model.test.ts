import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {PermissionEntityInheritanceMapItem} from '../../../definitions/permissionGroups.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {generateAndInsertAgentTokenListForTest} from '../../../endpoints/testHelpers/generate/agentToken.js';
import {
  generateAndInsertAssignedItemListForTest,
  generateAndInsertPermissionGroupListForTest,
} from '../../../endpoints/testHelpers/generate/permissionGroup.js';
import {
  generateAndInsertPermissionItemListForTest,
  generatePermissionItemForTest,
  generatePermissionItemListForTest,
} from '../../../endpoints/testHelpers/generate/permissionItem.js';
import {generateAndInsertUserListForTest} from '../../../endpoints/testHelpers/generate/user.js';
import {
  generateAgent,
  generateTestList,
} from '../../../endpoints/testHelpers/generate/utils.js';
import {expectContainsExactly} from '../../../endpoints/testHelpers/helpers/assertion.js';
import {expectErrorThrown} from '../../../endpoints/testHelpers/helpers/error.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kIjxSemantic} from '../../ijx/injectables.js';
import {DataSemanticPermission} from './model.js';

const model = new DataSemanticPermission();

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('DataSemanticPermission', () => {
  test('sortItems, with entity, no target or date', () => {
    const now = getTimestamp();
    const entityId01 = getNewIdForResource(kFimidaraResourceType.User);
    const entityId02 = getNewIdForResource(kFimidaraResourceType.User);
    const targetId01 = getNewIdForResource(kFimidaraResourceType.Folder);
    const targetId02 = getNewIdForResource(kFimidaraResourceType.Folder);
    const [p01] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p02] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p03, p04] = generatePermissionItemListForTest(2, {
      lastUpdatedAt: now + 1,
      targetId: targetId02,
      entityId: entityId02,
    });

    const sortedPList = model.sortItems(
      [p01, p02, p03, p04],
      [entityId02, entityId01],
      [targetId01, targetId02],
      /** sortByEntity */ true,
      /** sortByTarget */ false,
      /** sortByDate */ false
    );

    expect(sortedPList.slice(0, 2).map(item => item.resourceId)).toEqual([
      p03.resourceId,
      p04.resourceId,
    ]);
    expect(sortedPList.slice(2).map(item => item.resourceId)).toEqual([
      p01.resourceId,
      p02.resourceId,
    ]);
  });

  test('sortItems, with target, no entity or date', () => {
    const now = getTimestamp();
    const entityId01 = getNewIdForResource(kFimidaraResourceType.User);
    const entityId02 = getNewIdForResource(kFimidaraResourceType.User);
    const targetId01 = getNewIdForResource(kFimidaraResourceType.Folder);
    const targetId02 = getNewIdForResource(kFimidaraResourceType.Folder);
    const [p01] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p02] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p03, p04] = generatePermissionItemListForTest(2, {
      lastUpdatedAt: now + 1,
      targetId: targetId02,
      entityId: entityId02,
    });

    const sortedPList = model.sortItems(
      [p01, p02, p03, p04],
      [entityId01, entityId02],
      [targetId02, targetId01],
      /** sortByEntity */ false,
      /** sortByTarget */ true,
      /** sortByDate */ false
    );

    expect(sortedPList.slice(0, 2).map(item => item.resourceId)).toEqual([
      p03.resourceId,
      p04.resourceId,
    ]);
    expect(sortedPList.slice(2).map(item => item.resourceId)).toEqual([
      p01.resourceId,
      p02.resourceId,
    ]);
  });

  test('sortItems, with date, no entity or target', () => {
    const now = getTimestamp();
    const entityId01 = getNewIdForResource(kFimidaraResourceType.User);
    const entityId02 = getNewIdForResource(kFimidaraResourceType.User);
    const targetId01 = getNewIdForResource(kFimidaraResourceType.Folder);
    const targetId02 = getNewIdForResource(kFimidaraResourceType.Folder);
    const [p01] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p02] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p03, p04] = generatePermissionItemListForTest(2, {
      lastUpdatedAt: now + 1,
      targetId: targetId02,
      entityId: entityId02,
    });

    const sortedPList = model.sortItems(
      [p01, p02, p03, p04],
      [entityId01, entityId02],
      [targetId02, targetId01],
      /** sortByEntity */ false,
      /** sortByTarget */ false,
      /** sortByDate */ true
    );

    expect(sortedPList.slice(0, 1).map(item => item.resourceId)).toEqual([
      p01.resourceId,
    ]);
    expect(sortedPList.slice(1, 3).map(item => item.resourceId)).toEqual([
      p03.resourceId,
      p04.resourceId,
    ]);
    expect(sortedPList.slice(3).map(item => item.resourceId)).toEqual([
      p02.resourceId,
    ]);
  });

  test('sortItems, all options', () => {
    const now = getTimestamp();
    const entityId01 = getNewIdForResource(kFimidaraResourceType.User);
    const entityId02 = getNewIdForResource(kFimidaraResourceType.User);
    const targetId01 = getNewIdForResource(kFimidaraResourceType.Folder);
    const targetId02 = getNewIdForResource(kFimidaraResourceType.Folder);
    const [p01] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now - 5,
      targetId: targetId01,
      entityId: entityId01,
    });
    const [p02] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId02,
      entityId: entityId01,
    });
    const [p03] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId02,
      entityId: entityId01,
    });
    const [p04] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now - 5,
      targetId: targetId01,
      entityId: entityId02,
    });
    const [p05] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId02,
      entityId: entityId02,
    });
    const [p06] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId02,
      entityId: entityId02,
    });

    const sortedPList = model.sortItems(
      faker.helpers.shuffle([p01, p02, p03, p04, p05, p06]),
      [entityId01, entityId02],
      [targetId02, targetId01],
      /** sortByEntity */ true,
      /** sortByTarget */ true,
      /** sortByDate */ true
    );

    expect(sortedPList[0].resourceId).toBe(p03.resourceId);
    expect(sortedPList[1].resourceId).toBe(p02.resourceId);
    expect(sortedPList[2].resourceId).toBe(p01.resourceId);
    expect(sortedPList[3].resourceId).toBe(p06.resourceId);
    expect(sortedPList[4].resourceId).toBe(p05.resourceId);
    expect(sortedPList[5].resourceId).toBe(p04.resourceId);
  });

  test('getEntity, user', async () => {
    const [user] = await generateAndInsertUserListForTest(1);

    const retrievedUser = await model.getEntity({entityId: user.resourceId});

    expect(retrievedUser).toMatchObject(user);
  });

  test('getEntity, agent token', async () => {
    const [token] = await generateAndInsertAgentTokenListForTest(1);

    const retrievedToken = await model.getEntity({entityId: token.resourceId});

    expect(retrievedToken).toMatchObject(token);
  });

  test('getEntity, permission group', async () => {
    const [pg] = await generateAndInsertAgentTokenListForTest(1);

    const retrievedPg = await model.getEntity({entityId: pg.resourceId});

    expect(retrievedPg).toMatchObject(pg);
  });

  test('getPermissionItems, no query throws error', async () => {
    await expectErrorThrown(async () => await model.getPermissionItems({}));
  });

  test('getPermissionItems, every query', async () => {
    const entityId = getNewIdForResource(kFimidaraResourceType.PermissionGroup);
    const action = faker.helpers.arrayElement(
      Object.values(kFimidaraPermissionActions)
    );
    const targetParentId = getNewIdForResource(kFimidaraResourceType.Folder);
    const targetId = getNewIdForResource(kFimidaraResourceType.File);
    const targetType = faker.helpers.arrayElement(
      Object.values(kFimidaraResourceType)
    );
    const pItems = await generateAndInsertPermissionItemListForTest(5, {
      entityId,
      action,
      targetParentId,
      targetId,
      targetType,
    });

    const items = await model.getPermissionItems({
      entityId,
      action,
      targetParentId,
      targetId,
    });

    expect(items).toHaveLength(pItems.length);
    expectContainsExactly(items, pItems, item => item.resourceId);
  });

  test('getPermissionItems, every query + multiple items', async () => {
    const resourceTypes = Object.values(kFimidaraResourceType);
    const count = faker.number.int({min: 2, max: 5});
    const idList = generateTestList(
      () => getNewIdForResource(faker.helpers.arrayElement(resourceTypes)),
      count
    );
    const actionList = faker.helpers.arrayElements(
      Object.values(kFimidaraPermissionActions),
      count
    );
    const targetParentId = getNewIdForResource(kFimidaraResourceType.Folder);
    const targetType = faker.helpers.arrayElements(resourceTypes, count);
    const rawItems = generateTestList(
      () =>
        generatePermissionItemForTest({
          targetParentId,
          entityId: faker.helpers.arrayElement(idList),
          action: faker.helpers.arrayElement(actionList),
          targetId: faker.helpers.arrayElement(idList),
          targetType: faker.helpers.arrayElement(targetType),
        }),
      count
    );
    await kIjxSemantic
      .utils()
      .withTxn(async opts =>
        kIjxSemantic.permissionItem().insertItem(rawItems, opts)
      );

    const items = await model.getPermissionItems({
      targetParentId,
      entityId: idList,
      action: actionList,
      targetId: idList,
    });

    expect(items).toHaveLength(rawItems.length);
    expectContainsExactly(items, rawItems, item => item.resourceId);
  });

  test('getEntityInheritanceMap, shallow', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [pg] = await generateAndInsertPermissionGroupListForTest(1, {
      workspaceId,
    });
    const [pg02, pg03] = await generateAndInsertPermissionGroupListForTest(2, {
      workspaceId,
    });
    const [pg04, pg05] = await generateAndInsertPermissionGroupListForTest(2, {
      workspaceId,
    });
    const assignedAt = getTimestamp();
    const assignedBy = generateAgent();

    await Promise.all([
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg02.resourceId,
        assigneeId: pg.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg03.resourceId,
        assigneeId: pg.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg02.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg03.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg02.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg03.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
        workspaceId,
      }),
    ]);

    const map = await model.getEntityInheritanceMap({
      workspaceId: pg.workspaceId,
      entityId: pg.resourceId,
      fetchDeep: false,
    });

    const entities = Object.values(map);
    expect(entities).toHaveLength(3);
    expect(Object.keys(map)).toEqual(
      expect.arrayContaining([pg.resourceId, pg02.resourceId, pg03.resourceId])
    );
    expect(sortAssignedPermissionGroupMetas(map[pg.resourceId])).toMatchObject(
      sortAssignedPermissionGroupMetas({
        id: pg.resourceId,
        resolvedOrder: 0,
        items: [
          {
            assignedAt,
            assignedBy,
            permissionGroupId: pg02.resourceId,
            assigneeEntityId: pg.resourceId,
          },
          {
            assignedAt,
            assignedBy,
            permissionGroupId: pg03.resourceId,
            assigneeEntityId: pg.resourceId,
          },
        ],
      })
    );
    expect(map[pg02.resourceId]).toMatchObject({
      id: pg02.resourceId,
      resolvedOrder: 1,
      items: [],
    });
  });

  test('getEntityInheritanceMap, deep', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [pg] = await generateAndInsertPermissionGroupListForTest(1, {
      workspaceId,
    });
    const [pg02, pg03] = await generateAndInsertPermissionGroupListForTest(2, {
      workspaceId,
    });
    const [pg04, pg05] = await generateAndInsertPermissionGroupListForTest(2, {
      workspaceId,
    });

    await Promise.all([
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg02.resourceId,
        assigneeId: pg.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg03.resourceId,
        assigneeId: pg.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg02.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg03.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg02.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg03.resourceId,
        workspaceId,
      }),
    ]);

    const map = await model.getEntityInheritanceMap({
      workspaceId: pg.workspaceId,
      entityId: pg.resourceId,
      fetchDeep: true,
    });

    const entities = Object.values(map);
    expect(entities).toHaveLength(5);
    expect(Object.keys(map)).toEqual(
      expect.arrayContaining([
        pg.resourceId,
        pg02.resourceId,
        pg03.resourceId,
        pg04.resourceId,
        pg05.resourceId,
      ])
    );
    expect({
      ...map[pg.resourceId],
      items: map[pg.resourceId].items.sort((item01, item02) =>
        item01.permissionGroupId > item02.permissionGroupId ? 1 : -1
      ),
    }).toMatchObject({
      id: pg.resourceId,
      resolvedOrder: 0,
      items: [
        {permissionGroupId: pg02.resourceId, assigneeEntityId: pg.resourceId},
        {permissionGroupId: pg03.resourceId, assigneeEntityId: pg.resourceId},
      ].sort((item01, item02) =>
        item01.permissionGroupId > item02.permissionGroupId ? 1 : -1
      ),
    });
    expect({
      ...map[pg02.resourceId],
      items: map[pg02.resourceId].items.sort((item01, item02) =>
        item01.permissionGroupId > item02.permissionGroupId ? 1 : -1
      ),
    }).toMatchObject({
      id: pg02.resourceId,
      resolvedOrder: 1,
      items: [
        {permissionGroupId: pg04.resourceId, assigneeEntityId: pg02.resourceId},
        {permissionGroupId: pg05.resourceId, assigneeEntityId: pg02.resourceId},
      ].sort((item01, item02) =>
        item01.permissionGroupId > item02.permissionGroupId ? 1 : -1
      ),
    });
    expect(map[pg04.resourceId]).toMatchObject({
      id: pg04.resourceId,
      resolvedOrder: 2,
      items: [],
    });
  });

  test('getEntityAssignedPermissionGroups, shallow', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [pg] = await generateAndInsertPermissionGroupListForTest(1, {
      workspaceId,
    });
    const [pg02, pg03] = await generateAndInsertPermissionGroupListForTest(2, {
      workspaceId,
    });
    const [pg04, pg05] = await generateAndInsertPermissionGroupListForTest(2, {
      workspaceId,
    });

    await Promise.all([
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg02.resourceId,
        assigneeId: pg.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg03.resourceId,
        assigneeId: pg.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg02.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg03.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg02.resourceId,
        workspaceId,
      }),
      generateAndInsertAssignedItemListForTest(1, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg03.resourceId,
        workspaceId,
      }),
    ]);

    const {permissionGroups} = await model.getEntityAssignedPermissionGroups({
      workspaceId: pg.workspaceId,
      entityId: pg.resourceId,
      fetchDeep: false,
    });

    expect(permissionGroups).toHaveLength(2);
    expectContainsExactly(permissionGroups, [pg02, pg03], pg => pg.resourceId);
  });
});

function sortAssignedPermissionGroupMetas(
  item: PermissionEntityInheritanceMapItem
) {
  item.items.sort((a, b) =>
    a.permissionGroupId.localeCompare(b.permissionGroupId)
  );
  return item;
}
