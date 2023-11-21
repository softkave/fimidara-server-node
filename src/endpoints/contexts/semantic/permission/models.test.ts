import {faker} from '@faker-js/faker';
import {PermissionEntityInheritanceMapItem} from '../../../../definitions/permissionGroups';
import {kPermissionsMap} from '../../../../definitions/permissionItem';
import {AppResourceTypeMap} from '../../../../definitions/system';
import {getTimestamp} from '../../../../utils/dateFns';
import {getNewIdForResource} from '../../../../utils/resource';
import {generateAndInsertAgentTokenListForTest} from '../../../testUtils/generateData/agentToken';
import {
  generateAndInsertAssignedItemListForTest,
  generateAndInsertPermissionGroupListForTest,
} from '../../../testUtils/generateData/permissionGroup';
import {
  generateAndInsertPermissionItemListForTest,
  generatePermissionItemForTest,
  generatePermissionItemListForTest,
} from '../../../testUtils/generateData/permissionItem';
import {generateAndInsertUserListForTest} from '../../../testUtils/generateData/user';
import {generateAgent, generateTestList} from '../../../testUtils/generateData/utils';
import {expectContainsExactly} from '../../../testUtils/helpers/assertion';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
import {completeTest} from '../../../testUtils/helpers/test';
import {assertContext, initTestBaseContext} from '../../../testUtils/testUtils';
import {BaseContextType} from '../../types';
import {DataSemanticDataAccessPermission} from './models';

let context: BaseContextType | null = null;
const model = new DataSemanticDataAccessPermission();

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('DataSemanticDataAccessPermission', () => {
  test('sortByDate', () => {
    const now = getTimestamp();
    const [p01, p02] = generatePermissionItemListForTest(2, {lastUpdatedAt: now});
    const [p03, p04] = generatePermissionItemListForTest(2, {lastUpdatedAt: now + 1});

    const sortedPList = model.sortByDate([p01, p02, p03, p04]);

    expect(sortedPList[0].resourceId).toBe(p03.resourceId);
    expect(sortedPList[1].resourceId).toBe(p04.resourceId);
    expect(sortedPList[2].resourceId).toBe(p01.resourceId);
    expect(sortedPList[3].resourceId).toBe(p02.resourceId);
  });

  test('sortByTarget without sortByDate', () => {
    const now = getTimestamp();
    const targetId01 = getNewIdForResource(AppResourceTypeMap.Folder);
    const targetId02 = getNewIdForResource(AppResourceTypeMap.Folder);
    const [p01] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId01,
    });
    const [p02] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId01,
    });
    const [p03, p04] = generatePermissionItemListForTest(2, {
      lastUpdatedAt: now + 1,
      targetId: targetId02,
    });

    const sortedPList = model.sortByTarget(
      [targetId02, targetId01],
      [p01, p02, p03, p04],
      false
    );

    expect(sortedPList[0].resourceId).toBe(p03.resourceId);
    expect(sortedPList[1].resourceId).toBe(p04.resourceId);
    expect(sortedPList[2].resourceId).toBe(p01.resourceId);
    expect(sortedPList[3].resourceId).toBe(p02.resourceId);
  });

  test('sortByTarget with sortByDate', () => {
    const now = getTimestamp();
    const targetId01 = getNewIdForResource(AppResourceTypeMap.Folder);
    const targetId02 = getNewIdForResource(AppResourceTypeMap.Folder);
    const [p01] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now + 5,
      targetId: targetId01,
    });
    const [p02] = generatePermissionItemListForTest(1, {
      lastUpdatedAt: now,
      targetId: targetId01,
    });
    const [p03, p04] = generatePermissionItemListForTest(2, {
      lastUpdatedAt: now + 1,
      targetId: targetId02,
    });

    const sortedPList = model.sortByTarget(
      [targetId02, targetId01],
      [p01, p02, p03, p04],
      true
    );

    expect(sortedPList.slice(0, 2).map(item => item.resourceId)).toEqual([
      p03.resourceId,
      p04.resourceId,
    ]);
    expect(sortedPList[2].resourceId).toBe(p02.resourceId);
    expect(sortedPList[3].resourceId).toBe(p01.resourceId);
  });

  test('getEntity, user', async () => {
    assertContext(context);
    const [user] = await generateAndInsertUserListForTest(context, 1);

    const retrievedUser = await model.getEntity({context, entityId: user.resourceId});

    expect(retrievedUser).toMatchObject(user);
  });

  test('getEntity, agent token', async () => {
    assertContext(context);
    const [token] = await generateAndInsertAgentTokenListForTest(context, 1);

    const retrievedToken = await model.getEntity({context, entityId: token.resourceId});

    expect(retrievedToken).toMatchObject(token);
  });

  test('getEntity, permission group', async () => {
    assertContext(context);
    const [pg] = await generateAndInsertAgentTokenListForTest(context, 1);

    const retrievedPg = await model.getEntity({context, entityId: pg.resourceId});

    expect(retrievedPg).toMatchObject(pg);
  });

  test('getPermissionItems, no query throws error', async () => {
    assertContext(context);

    await expectErrorThrown(
      async () => await model.getPermissionItems({context: context!})
    );
  });

  test('getPermissionItems, every query', async () => {
    assertContext(context);
    const entityId = getNewIdForResource(AppResourceTypeMap.PermissionGroup);
    const action = faker.helpers.arrayElement(Object.values(kPermissionsMap));
    const targetParentId = getNewIdForResource(AppResourceTypeMap.Folder);
    const targetId = getNewIdForResource(AppResourceTypeMap.File);
    const targetType = faker.helpers.arrayElement(Object.values(AppResourceTypeMap));
    const pItems = await generateAndInsertPermissionItemListForTest(context, 5, {
      entityId,
      action,
      targetParentId,
      targetId,
      targetType,
    });

    const items = await model.getPermissionItems({
      context,
      entityId,
      action,
      targetParentId,
      targetId,
      targetType,
    });

    expect(items).toHaveLength(pItems.length);
    expectContainsExactly(items, pItems, item => item.resourceId);
  });

  test('getPermissionItems, every query + multiple items', async () => {
    assertContext(context);
    const resourceTypes = Object.values(AppResourceTypeMap);
    const count = faker.number.int({min: 2, max: 5});
    const idList = generateTestList(
      () => getNewIdForResource(faker.helpers.arrayElement(resourceTypes)),
      count
    );
    const actionList = faker.helpers.arrayElements(Object.values(kPermissionsMap), count);
    const targetParentId = getNewIdForResource(AppResourceTypeMap.Folder);
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
    await context.semantic.utils.withTxn(context, async opts =>
      context!.semantic.permissionItem.insertItem(rawItems, opts)
    );

    const items = await model.getPermissionItems({
      context,
      targetParentId,
      targetType,
      entityId: idList,
      action: actionList,
      targetId: idList,
    });

    expect(items).toHaveLength(rawItems.length);
    expectContainsExactly(items, rawItems, item => item.resourceId);
  });

  test('getEntityInheritanceMap, shallow', async () => {
    assertContext(context);
    const [pg] = await generateAndInsertPermissionGroupListForTest(context, 1);
    const [pg02, pg03] = await generateAndInsertPermissionGroupListForTest(context, 2);
    const [pg04, pg05] = await generateAndInsertPermissionGroupListForTest(context, 2);
    const assignedAt = getTimestamp();
    const assignedBy = generateAgent();

    await Promise.all([
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg02.resourceId,
        assigneeId: pg.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg03.resourceId,
        assigneeId: pg.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg02.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg03.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg02.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg03.resourceId,
        createdAt: assignedAt,
        createdBy: assignedBy,
      }),
    ]);

    const map = await model.getEntityInheritanceMap({
      context,
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
    assertContext(context);
    const [pg] = await generateAndInsertPermissionGroupListForTest(context, 1);
    const [pg02, pg03] = await generateAndInsertPermissionGroupListForTest(context, 2);
    const [pg04, pg05] = await generateAndInsertPermissionGroupListForTest(context, 2);

    await Promise.all([
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg02.resourceId,
        assigneeId: pg.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg03.resourceId,
        assigneeId: pg.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg02.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg03.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg02.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg03.resourceId,
      }),
    ]);

    const map = await model.getEntityInheritanceMap({
      context,
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
    expect(map[pg.resourceId]).toMatchObject({
      id: pg.resourceId,
      resolvedOrder: 0,
      items: [
        {permissionGroupId: pg02.resourceId, assigneeEntityId: pg.resourceId},
        {permissionGroupId: pg03.resourceId, assigneeEntityId: pg.resourceId},
      ],
    });
    expect(map[pg02.resourceId]).toMatchObject({
      id: pg02.resourceId,
      resolvedOrder: 1,
      items: [
        {permissionGroupId: pg04.resourceId, assigneeEntityId: pg02.resourceId},
        {permissionGroupId: pg05.resourceId, assigneeEntityId: pg02.resourceId},
      ],
    });
    expect(map[pg04.resourceId]).toMatchObject({
      id: pg04.resourceId,
      resolvedOrder: 2,
      items: [],
    });
  });

  test('getEntityAssignedPermissionGroups, shallow', async () => {
    assertContext(context);
    const [pg] = await generateAndInsertPermissionGroupListForTest(context, 1);
    const [pg02, pg03] = await generateAndInsertPermissionGroupListForTest(context, 2);
    const [pg04, pg05] = await generateAndInsertPermissionGroupListForTest(context, 2);

    await Promise.all([
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg02.resourceId,
        assigneeId: pg.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg03.resourceId,
        assigneeId: pg.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg02.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg04.resourceId,
        assigneeId: pg03.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg02.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(context, {
        assignedItemId: pg05.resourceId,
        assigneeId: pg03.resourceId,
      }),
    ]);

    const {permissionGroups} = await model.getEntityAssignedPermissionGroups({
      context,
      entityId: pg.resourceId,
      fetchDeep: false,
    });

    expect(permissionGroups).toHaveLength(2);
    expectContainsExactly(permissionGroups, [pg02, pg03], pg => pg.resourceId);
  });
});

function sortAssignedPermissionGroupMetas(item: PermissionEntityInheritanceMapItem) {
  item.items.sort((a, b) => a.permissionGroupId.localeCompare(b.permissionGroupId));
  return item;
}
