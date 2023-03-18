import {faker} from '@faker-js/faker';
import assert from 'assert';
import {first, forEach} from 'lodash';
import {IResource} from '../../../../definitions/system';
import {getTimestamp} from '../../../../utils/dateFns';
import {
  extractResourceIdList,
  getResourceId,
  loopAndCollate,
  makeKey,
  noopAsync,
} from '../../../../utils/fns';
import {getNewId} from '../../../../utils/resourceId';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {PartialRecord} from '../../../../utils/types';
import {expectContainsExactly} from '../../../testUtils/helpers/assertion';
import {LiteralDataQuery} from '../../data/types';
import {MemStore, MemStoreTransaction} from '../Mem';
import {
  MemStoreIndexTypes,
  MemStoreTransactionConsistencyOp,
  MemStoreTransactionConsistencyOpTypes,
} from '../types';

const seedResources = seedTestResourceList(1000);
const mem01 = new MemStore(seedResources, [
  {type: MemStoreIndexTypes.MapIndex, field: 'field01'},
  {type: MemStoreIndexTypes.MapIndex, field: 'field02', caseInsensitive: true},
]);

describe('MemStore', () => {
  test('createItems', async () => {
    const tx01 = new MemStoreTransaction();
    const items01 = seedTestResourceList(3);
    const q: LiteralDataQuery<ITestResource> = {resourceId: {$in: extractResourceIdList(items01)}};
    await mem01.createItems(items01, tx01);
    let items01WithTx = await mem01.readManyItems(q, tx01);
    let items01WithoutTx = await mem01.readManyItems(q);
    await tx01.commit(async consistencyOps => {
      checkConsistencyOps(consistencyOps, items01, MemStoreTransactionConsistencyOpTypes.Insert);
    });
    let items01AfterCommitingTx = await mem01.readManyItems(q);
    expect(items01WithTx).toEqual(expect.arrayContaining(items01));
    expect(items01WithoutTx).toHaveLength(0);
    expect(items01AfterCommitingTx).toEqual(expect.arrayContaining(items01));
  });

  test('readItem', async () => {
    const item01 = first(seedResources);
    const itemReturned = await mem01.readItem({resourceId: item01?.resourceId});
    assert(itemReturned);
    expect(item01).toMatchObject(itemReturned);
  });

  test('readManyItems', async () => {
    const items01 = seedResources.slice(0, 10);
    const itemsReturned = await mem01.readManyItems({
      resourceId: {$in: extractResourceIdList(items01)},
    });
    expect(itemsReturned).toEqual(expect.arrayContaining(items01));
  });

  test('countItems', async () => {
    const items01 = seedTestResourceList(10, {field01: getNewId()});
    mem01.UNSAFE_ingestItems(items01);
    const count = await mem01.countItems({
      field01: {$in: items01.map(item => item.field01)},
    });
    expect(count).toBe(items01.length);
  });

  test('exists', async () => {
    const item01 = seedTestResource({field01: getNewId()});
    mem01.UNSAFE_ingestItems(item01);
    const found = await mem01.exists({field01: item01.field01});
    expect(found).toBeTruthy();
  });

  test('updateItem', async () => {
    const tx01 = new MemStoreTransaction();
    const item01 = first(seedResources);
    const update: Partial<ITestResource> = {field02: getNewId()};
    const itemReturned = await mem01.updateItem({resourceId: item01?.resourceId}, update, tx01);
    const itemWithTx = await mem01.readItem({resourceId: item01?.resourceId}, tx01);
    const itemWithoutTx = await mem01.readItem({resourceId: item01?.resourceId});
    await tx01.commit(async consistencyOps => {
      checkConsistencyOps(consistencyOps, [item01!], MemStoreTransactionConsistencyOpTypes.Update);
    });
    const itemWithoutTxAfterCommit = await mem01.readItem({resourceId: item01?.resourceId});
    assert(itemReturned && item01);
    expect(itemReturned).toMatchObject(update);
    expect(itemReturned.resourceId).toBe(item01.resourceId);
    expect(itemWithTx).toMatchObject(itemReturned);
    expect(itemWithoutTx).toMatchObject(item01);
    expect(itemWithoutTxAfterCommit).toMatchObject(itemReturned);
  });

  test('updateManyItems', async () => {
    const tx01 = new MemStoreTransaction();
    const items01 = seedResources.slice(0, 10);
    const update: Partial<ITestResource> = {field02: getNewId()};
    const q: LiteralDataQuery<ITestResource> = {resourceId: {$in: extractResourceIdList(items01)}};
    const itemsReturned = await mem01.updateManyItems(q, update, tx01);
    const itemsWithTx = await mem01.readManyItems(q, tx01);
    const itemsWithoutTx = await mem01.readManyItems(q);
    await tx01.commit(async consistencyOps => {
      checkConsistencyOps(consistencyOps, items01, MemStoreTransactionConsistencyOpTypes.Update);
    });
    const itemsWithoutTxAfterCommit = await mem01.readManyItems(q);
    forEach(itemsReturned, item => {
      expect(item).toMatchObject(update);
    });
    expectContainsExactly(items01, itemsReturned, getResourceId);
    expectContainsExactly(itemsWithTx, itemsReturned, item =>
      makeKey([item.resourceId, item.field02])
    );
    expect(itemsWithoutTx).toHaveLength(0);
    expectContainsExactly(itemsWithoutTxAfterCommit, itemsReturned, item =>
      makeKey([item.resourceId, item.field02])
    );
  });

  test('multiple transactions', async () => {
    const tx01 = new MemStoreTransaction();
    const tx02 = new MemStoreTransaction();
    const tx03 = new MemStoreTransaction();
    const tx05 = new MemStoreTransaction();
    const tx06 = new MemStoreTransaction();
    const items01Field01 = getNewId();
    const items01Field05 = getNewId();
    const items01 = seedTestResourceList(3, {field01: items01Field01});
    const items02 = seedTestResourceList(4);
    const items05 = seedTestResourceList(5, {field01: items01Field05});

    const scenario01 = async () => {
      const exists = await mem01.exists({field01: items01Field01});
      if (!exists) {
        await mem01.createItems(items01, tx01);
      }
      const itemsReturned = await mem01.readManyItems({field01: items01Field01}, tx01);
      await tx01.commit(async consistencyOps => {
        checkConsistencyOps(consistencyOps, items01, MemStoreTransactionConsistencyOpTypes.Insert);
      });
      expectContainsExactly(itemsReturned, items01, getResourceId);
    };

    const scenario02 = async () => {
      const count = await mem01.countItems({field01: items01Field01});
      expect(count).toBeGreaterThan(0);
      await mem01.createItems(items02, tx02);
      const itemsReturned = await mem01.readManyItems(
        {resourceId: {$in: extractResourceIdList(items02)}},
        tx01
      );
      await tx02.commit(async consistencyOps => {
        checkConsistencyOps(consistencyOps, items02, MemStoreTransactionConsistencyOpTypes.Insert);
      });
      expectContainsExactly(itemsReturned, items02, getResourceId);
    };

    const scenario03 = async () => {
      const exists = await mem01.exists({field01: items01Field01}, tx03);
      expect(exists).toBeTruthy();
      await tx03.commit(noopAsync);
    };

    const scenario05 = async () => {
      const exists = await mem01.exists({field01: items01Field05});
      if (!exists) {
        await mem01.createItems(items01, tx05);
      }
      const itemsReturned = await mem01.readManyItems(
        {resourceId: {$in: extractResourceIdList(items05)}},
        tx05
      );
      await tx05.commit(async consistencyOps => {
        checkConsistencyOps(consistencyOps, items05, MemStoreTransactionConsistencyOpTypes.Insert);
      });
      expectContainsExactly(itemsReturned, items05, getResourceId);
    };

    const scenario04 = async () => {
      const exists = await mem01.exists({field01: items01Field05});
      expect(exists).toBeFalsy();
    };

    const scenario06 = async () => {
      const items06 = seedResources.slice(0, 10);
      const update: Partial<ITestResource> = {field02: getNewId()};
      const q: LiteralDataQuery<ITestResource> = {
        resourceId: {$in: extractResourceIdList(items06)},
      };
      const itemsReturned = await mem01.updateManyItems(q, update, tx06);
      await tx06.commit(async consistencyOps => {
        checkConsistencyOps(consistencyOps, items06, MemStoreTransactionConsistencyOpTypes.Update);
      });
      forEach(itemsReturned, item => {
        expect(item).toMatchObject(update);
      });
      expectContainsExactly(items06, itemsReturned, getResourceId);
    };

    await Promise.all([
      scenario01(),
      scenario02(),
      scenario03(),
      scenario04(),
      scenario05(),
      scenario06(),
    ]);
  });

  test('commit fails', async () => {
    const tx01 = new MemStoreTransaction();
    const tx02 = new MemStoreTransaction();
    const items01Field01 = getNewId();
    const items01 = seedTestResourceList(3, {field01: items01Field01});
    const items02 = seedTestResourceList(4);

    const scenario01 = async () => {
      const exists = await mem01.exists({field01: items01Field01});
      if (!exists) {
        await mem01.createItems(items01, tx01);
      }
      await tx01.commit(async () => {
        throw new Error();
      });
    };

    const scenario02 = async () => {
      await mem01.createItems(items02, tx02);
      await tx02.commit(async consistencyOps => {
        checkConsistencyOps(consistencyOps, items02, MemStoreTransactionConsistencyOpTypes.Insert);
      });
    };

    const results = await Promise.allSettled([scenario01(), scenario02()]);
    expect(results[0]?.status === 'rejected').toBeTruthy();
    expect(results[1]?.status === 'fulfilled').toBeTruthy();

    const items01Returned = await mem01.readManyItems({
      resourceId: {$in: extractResourceIdList(items01)},
    });
    const items02Returned = await mem01.readManyItems({
      resourceId: {$in: extractResourceIdList(items02)},
    });
    expect(items01Returned).toHaveLength(0);
    expect(items02Returned).toHaveLength(items02.length);
  });

  test('syncTxnOps', () => {
    throw reuseableErrors.common.notImplemented();
  });
});

interface ITestResource extends IResource {
  field01: string;
  field02: string;
}

function seedTestResource(seed: Partial<ITestResource> = {}): ITestResource {
  return {
    resourceId: getNewId(),
    createdAt: getTimestamp(),
    lastUpdatedAt: getTimestamp(),
    field01: faker.lorem.words(3),
    field02: faker.lorem.words(3),
    ...seed,
  };
}

function seedTestResourceList(count = 100, seed: Partial<ITestResource> = {}): ITestResource[] {
  return loopAndCollate(count, () => seedTestResource(seed));
}

function checkConsistencyOps(
  consistencyOps: MemStoreTransactionConsistencyOp[],
  items: ITestResource[],
  type: MemStoreTransactionConsistencyOpTypes
) {
  const idMap: PartialRecord<string, string> = {};
  consistencyOps.forEach(op => {
    if (op.type === type) {
      op.idList.forEach(id => {
        idMap[id] = id;
      });
    }
  });

  items.forEach(item => {
    expect(idMap[item.resourceId]).toBeTruthy();
  });
}
