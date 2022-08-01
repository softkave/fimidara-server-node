import {faker} from '@faker-js/faker';
import assert from 'assert';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getWorkspaceModel} from '../../db/workspace';
import {systemAgent} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import {generateTestWorkspaces} from '../../endpoints/test-utils/generate-data/workspace';
import {getTestVars} from '../../endpoints/test-utils/vars';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';

let connection: Connection | null = null;
let dbName: string | null = null;

beforeAll(async () => {
  const appVariables = getTestVars();
  dbName = faker.lorem.words(5);
  connection = await getMongoConnection(appVariables.mongoDbURI, dbName);
});

afterAll(async () => {
  await connection?.close();
});

describe('unlockUsageThresholds', () => {
  test('usage thresholds unlocked', async () => {
    // setup
    const workspaces = generateTestWorkspaces(10);
    const locks: IWorkspace['usageThresholdLocks'] = {};
    Object.values(UsageRecordCategory).forEach(k => {
      locks[k] = {
        locked: true,
        category: k,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: systemAgent,
      };
    });

    workspaces.forEach(workspace => {
      workspace.usageThresholdLocks = locks;
    });

    // run
    assert(connection);
    await unlockUsageThresholdLocks(connection);

    // verify
    const model = getWorkspaceModel(connection);
    const dbWorkspaces = await model.find({}).lean().exec();
    expect(dbWorkspaces.length).toHaveLength(workspaces.length);
    dbWorkspaces.forEach(dbWorkspace => {
      const locks = dbWorkspace.usageThresholdLocks || {};
      Object.values(UsageRecordCategory).forEach(k => {
        expect(locks[k]?.locked).toBe(false);
      });
    });
  });
});
