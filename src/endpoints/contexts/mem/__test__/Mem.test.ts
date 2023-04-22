import {faker} from '@faker-js/faker';
import assert from 'assert';
import {first, merge} from 'lodash';
import {Resource} from '../../../../definitions/system';
import {getTimestamp} from '../../../../utils/dateFns';
import {
  extractResourceIdList,
  getResourceId,
  loopAndCollate,
  noopAsync,
  toArray,
  waitTimeout,
} from '../../../../utils/fns';
import {getNewId} from '../../../../utils/resource';
import {PartialRecord} from '../../../../utils/types';
import {disposeApplicationGlobalUtilities} from '../../../globalUtils';
import {expectContainsExactly} from '../../../testUtils/helpers/assertion';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
import {LiteralDataQuery} from '../../data/types';
import {MemStore, MemStoreLockTimeoutError, MemStoreTransaction} from '../Mem';
import {
  MemStoreIndexTypes,
  MemStoreTransactionConsistencyOp,
  MemStoreTransactionConsistencyOpTypes,
  MemStoreTransactionState,
  MemStoreTransactionType,
} from '../types';

const seedResources = seedTestResourceList(5);
const mem01 = new MemStore(seedResources, [
  {type: MemStoreIndexTypes.MapIndex, field: 'field01'},
  {type: MemStoreIndexTypes.MapIndex, field: 'field02', caseInsensitive: true},
]);

afterAll(async () => {
  mem01.dispose();
  await disposeApplicationGlobalUtilities();
});

describe('MemStore', () => {
  test('createItems', async () => {
    const tx01 = new MemStoreTransaction();
    const items01 = seedTestResourceList(3);
    const q: LiteralDataQuery<ITestResource> = {resourceId: {$in: extractResourceIdList(items01)}};
    await mem01.createItems(items01, tx01);
    let items01WithTx = await mem01.readManyItems(q, tx01);
    let items01WithoutTx = await mem01.readManyItems(q);
    await tx01.commit(async consistencyOps => {
      checkConsistencyOps(
        consistencyOps,
        items01,
        MemStoreTransactionConsistencyOpTypes.Insert,
        tx01
      );
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
    const items01 = seedTestResourceList(10);
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
      checkConsistencyOps(
        consistencyOps,
        [merge({}, item01, update)],
        MemStoreTransactionConsistencyOpTypes.Update,
        tx01
      );
    });
    const itemWithoutTxAfterCommit = await mem01.readItem({resourceId: item01?.resourceId});
    assert(itemReturned && item01);
    expect(itemReturned).toMatchObject(update);
    expect(itemReturned.resourceId).toBe(item01.resourceId);
    expect(itemWithTx).toMatchObject(itemReturned);
    expect(itemWithoutTx).toMatchObject(item01);
    expect(itemWithoutTxAfterCommit).toMatchObject(itemReturned);
  });

  // TODO: preferrably, in the future, capture data from tests or
  // machine-readable only prod data and use for multi-transaction tests and
  // simulations.
  test('multiple transactions', async () => {
    const tx01 = new MemStoreTransaction();
    // const tx01_01 = new MemStoreTransaction();
    const tx02 = new MemStoreTransaction();
    const tx03 = new MemStoreTransaction();
    const tx04 = new MemStoreTransaction();
    const items01Field01 = getNewId();
    const items01Field01_update01 = getNewId();
    const items01 = seedTestResourceList(3, {field01: items01Field01});
    const item01_withUpdate = items01.map(nextItem =>
      merge({}, nextItem, {field01: items01Field01_update01})
    );

    // Checks if a row exists (which should lock the table for create and update
    // ops), then add row (which should lock transaction read) if it doesn't
    // exist.
    const scenario01 = async () => {
      const exists = await mem01.exists({field01: items01Field01}, tx01);
      expect(exists).toBe(false);
      if (!exists) {
        await mem01.createItems(items01, tx01);
      }
      const itemsReturnedWithTxn = await mem01.readManyItems({field01: items01Field01}, tx01);
      const itemsReturnedWithoutTxn = await mem01.readManyItems({field01: items01Field01});
      await tx01.commit(async consistencyOps => {
        checkConsistencyOps(
          consistencyOps,
          items01,
          MemStoreTransactionConsistencyOpTypes.Insert,
          tx01
        );
      });
      const itemsReturnedAfterTxn = await mem01.readManyItems({field01: items01Field01});
      expectContainsExactly(itemsReturnedWithTxn, items01, getResourceId);
      expect(itemsReturnedWithoutTxn).toHaveLength(0);
      expectContainsExactly(itemsReturnedAfterTxn, items01, getResourceId);
    };

    // Runs simutaneously with scenario01. Tests that transaction read is locked
    // preventing adding the same row twice.
    // This test will fail because of the way JS promises work. Check the todo
    // at the top of the Mem.ts file for more info.
    // const scenario01_01 = async () => {
    //   const exists = await mem01.exists({field01: items01Field01}, tx01_01);
    //   expect(exists).toBe(true);
    //   await tx01_01.commit(noopAsync);
    // };

    // Runs after scenario01 is complete and attempts to update item01 which
    // should add a row lock to that row.
    const scenario02 = async () => {
      await mem01.updateManyItems(
        {field01: items01Field01},
        {field01: items01Field01_update01},
        tx02
      );
      const items01ReturnedWithTxn = await mem01.readManyItems({field01: items01Field01}, tx02);
      const items01ReturnedWithoutTxn = await mem01.readManyItems({field01: items01Field01});
      const updatedItems01ReturnedWithTxn = await mem01.readManyItems(
        {field01: items01Field01_update01},
        tx02
      );
      const updatedItems01ReturnedWithoutTxn = await mem01.readManyItems({
        field01: items01Field01_update01,
      });

      await tx02.commit(async consistencyOps => {
        checkConsistencyOps(
          consistencyOps,
          item01_withUpdate,
          MemStoreTransactionConsistencyOpTypes.Update,
          tx02
        );
      });

      expect(items01ReturnedWithTxn).toHaveLength(0);
      expect(updatedItems01ReturnedWithoutTxn).toHaveLength(0);
      expectContainsExactly(items01ReturnedWithoutTxn, items01, item => item.field01);
      expectContainsExactly(updatedItems01ReturnedWithTxn, item01_withUpdate, item => item.field01);

      const updatedReturnedAfterTxn = await mem01.readManyItems({field01: items01Field01_update01});
      const items01ReturnedAfterTxn = await mem01.readManyItems({field01: items01Field01});
      expect(items01ReturnedAfterTxn).toHaveLength(0);
      expectContainsExactly(updatedReturnedAfterTxn, item01_withUpdate, item => item.field01);
    };

    // Runs simultaneously with scenario02 asserting that transaction read is
    // locked on update, so exists result should be after tx02 is commited.
    const scenario03 = async () => {
      const exists = await mem01.exists({field01: items01Field01}, tx03);
      expect(exists).toBeFalsy();
      await tx03.commit(noopAsync);
    };

    // Runs after scenario02 and asserts that delete logic is correct, i.e
    // deleted items are not returned when reading with txn, and are when
    // reading without txn, and lastly, that they are removed whe txn commits.
    const scenario04 = async () => {
      await mem01.deleteManyItems({field01: items01Field01_update01}, tx04);
      const deletedItems01ReturnedWithTxn = await mem01.readManyItems(
        {field01: items01Field01_update01},
        tx04
      );
      const deletedItems01ReturnedWithoutTxn = await mem01.readManyItems({
        field01: items01Field01_update01,
      });

      await tx04.commit(async consistencyOps => {
        checkConsistencyOps(
          consistencyOps,
          items01,
          MemStoreTransactionConsistencyOpTypes.Delete,
          tx04
        );
      });

      expect(deletedItems01ReturnedWithTxn).toHaveLength(0);
      expectContainsExactly(
        deletedItems01ReturnedWithoutTxn,
        item01_withUpdate,
        item => item.field01
      );

      const deletedItems01ReturnedAfterTxn = await mem01.readManyItems({
        field01: items01Field01_update01,
      });
      expect(deletedItems01ReturnedAfterTxn).toHaveLength(0);
    };

    await Promise.all([
      scenario01(),
      // scenario01_01()
    ]);
    await Promise.all([scenario02(), scenario03()]);
    await Promise.all([scenario04()]);
  });

  test('locks are released when txn commit fails', async () => {
    const tx01 = new MemStoreTransaction();
    const tx02 = new MemStoreTransaction();
    const items01Field01 = getNewId();
    const items01 = seedTestResourceList(3, {field01: items01Field01});
    const items02 = seedTestResourceList(4);

    const scenario01 = async () => {
      const exists = await mem01.exists({field01: items01Field01}, tx01);
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
        checkConsistencyOps(
          consistencyOps,
          items02,
          MemStoreTransactionConsistencyOpTypes.Insert,
          tx02
        );
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

  test('timeout locks are relased and txns aborted', async () => {
    const txn01 = new MemStoreTransaction();
    const txn02 = new MemStoreTransaction();
    const txn03 = new MemStoreTransaction();
    const txn04 = new MemStoreTransaction();
    const items01Field01 = getNewId();
    const items01Field01_update = getNewId();
    const items01 = seedTestResourceList(3, {field01: items01Field01});

    const scenario01 = async (txn: MemStoreTransactionType) => {
      await mem01.createItems(items01, txn);
    };

    // Using txn read for exists call to block and force subsequent calls after
    // the first to wait.
    const scenario01_01 = async (txn: MemStoreTransactionType) => {
      const exists = await mem01.exists({field01: items01Field01}, txn);
      if (!exists) await mem01.createItems(items01, txn);
    };

    // Wait until lock expires then attempt using it to confirm it's aborted.
    const scenario02 = async (txn: MemStoreTransactionType) => {
      await waitTimeout(MemStore.TXN_LOCK_TIMEOUT_MS + 1000);
      await expectErrorThrown(async () => {
        await mem01.updateManyItems(
          {field01: items01Field01},
          {field01: items01Field01_update},
          txn
        );
      }, [MemStoreLockTimeoutError.name]);
      expect(txn.getState()).toBe(MemStoreTransactionState.Aborted);
    };

    const scenario03 = async (txn: MemStoreTransactionType) => {
      await mem01.updateManyItems({field01: items01Field01}, {field01: items01Field01_update}, txn);
      await txn.commit(noopAsync);
      expect(txn.getState()).toBe(MemStoreTransactionState.Completed);
    };

    await Promise.all([scenario01(txn01), scenario01(txn02), scenario01(txn03)]);
    await Promise.all([scenario01_01(txn04)]);
    await Promise.all([scenario02(txn01), scenario02(txn02), scenario02(txn03), scenario03(txn04)]);
  });

  test('insertFilter with txn', async () => {
    const tx01 = new MemStoreTransaction();
    const items01Field01 = getNewId();
    const items02Field01 = getNewId();
    const items01 = seedTestResourceList(5, {field01: items01Field01});
    const items02 = seedTestResourceList(5, {field01: items02Field01});
    const mem02 = new MemStore<ITestResource>(
      [],
      [
        {type: MemStoreIndexTypes.MapIndex, field: 'field01'},
        {type: MemStoreIndexTypes.MapIndex, field: 'field02', caseInsensitive: true},
      ],
      {
        commitItemsFilter: item =>
          // Remove all items from item01
          toArray(item).filter(nextItem => nextItem.field01 !== items01Field01),
      }
    );
    await mem02.createItems(items01.concat(items02), tx01);

    const items01WithTx = await mem02.readManyItems({field01: items01Field01}, tx01);

    await tx01.commit(async consistencyOps => {
      checkConsistencyOps(
        consistencyOps,
        items01,
        MemStoreTransactionConsistencyOpTypes.Insert,
        tx01
      );
    });

    const items01AfterCommitingTx = await mem02.readManyItems({field01: items01Field01});
    const items02AfterCommitingTx = await mem02.readManyItems({field01: items02Field01});
    expect(items01WithTx).toEqual(expect.arrayContaining(items01));
    expect(items01AfterCommitingTx).toHaveLength(0);
    expect(items02AfterCommitingTx).toHaveLength(items02.length);
  });

  test('insertFilter without txn', async () => {
    const items01Field01 = getNewId();
    const items02Field01 = getNewId();
    const items01 = seedTestResourceList(5, {field01: items01Field01});
    const items02 = seedTestResourceList(5, {field01: items02Field01});
    const mem02 = new MemStore<ITestResource>(
      [],
      [
        {type: MemStoreIndexTypes.MapIndex, field: 'field01'},
        {type: MemStoreIndexTypes.MapIndex, field: 'field02', caseInsensitive: true},
      ],
      {
        commitItemsFilter: item =>
          // Remove all items from item01
          toArray(item).filter(nextItem => nextItem.field01 !== items01Field01),
      }
    );
    await mem02.UNSAFE_ingestItems(items01.concat(items02));

    const items01Returned = await mem02.readManyItems({field01: items01Field01});
    const items02Returned = await mem02.readManyItems({field01: items02Field01});
    expect(items01Returned).toHaveLength(0);
    expect(items02Returned).toHaveLength(items02.length);
  });
});

interface ITestResource extends Resource {
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
  type: MemStoreTransactionConsistencyOpTypes,
  txn: MemStoreTransactionType,
  checkExistence = true,
  checkMatchObject = type !== MemStoreTransactionConsistencyOpTypes.Delete
) {
  const itemsMap: PartialRecord<string, ITestResource | boolean> = {};
  consistencyOps.forEach(op => {
    if (op.type === type) {
      op.idList.forEach(id => {
        const item = txn.getFromCache<ITestResource>(id);
        itemsMap[id] = item ?? true;
      });
    }
  });

  items.forEach(item => {
    if (checkExistence) expect(itemsMap[item.resourceId]).toBeTruthy();
    if (checkMatchObject) expect(itemsMap[item.resourceId]).toMatchObject(item);
  });
}
