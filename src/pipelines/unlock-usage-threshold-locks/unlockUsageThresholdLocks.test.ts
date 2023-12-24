import {faker} from '@faker-js/faker';
import assert from 'assert';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getWorkspaceModel} from '../../db/workspace';
import {UsageRecordCategoryMap} from '../../definitions/usageRecord';
import {Workspace} from '../../definitions/workspace';
import {generateWorkspaceListForTest} from '../../endpoints/testUtils/generate/workspace';
import {dropMongoConnection} from '../../endpoints/testUtils/helpers/mongo';
import {completeTests} from '../../endpoints/testUtils/helpers/test';
import {fimidaraConfig} from '../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {getTimestamp} from '../../utils/dateFns';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';

let connection: Connection | null = null;
let dbName: string | null = null;

beforeAll(async () => {
  dbName = faker.lorem.words(5).replace(/ /g, '_');
  connection = await getMongoConnection(fimidaraConfig.mongoDbURI, dbName);
});

afterAll(async () => {
  await completeTests();
  if (connection) {
    await dropMongoConnection(connection);
  }
});

describe('unlockUsageThresholds', () => {
  test('usage thresholds unlocked', async () => {
    // setup
    const workspaces = generateWorkspaceListForTest(10);
    const locks: Workspace['usageThresholdLocks'] = {};
    Object.values(UsageRecordCategoryMap).forEach(k => {
      locks[k] = {
        locked: true,
        category: k,
        lastUpdatedAt: getTimestamp(),
        lastUpdatedBy: SYSTEM_SESSION_AGENT,
      };
    });

    workspaces.forEach(workspace => {
      workspace.usageThresholdLocks = locks;
    });

    assert(connection);
    const model = getWorkspaceModel(connection);
    await model.insertMany(workspaces);

    // run
    await unlockUsageThresholdLocks(connection);

    // verify

    const dbWorkspaces = await model.find({}).lean().exec();
    expect(dbWorkspaces.length).toBe(workspaces.length);
    dbWorkspaces.forEach(dbWorkspace => {
      const locks = dbWorkspace.usageThresholdLocks ?? {};
      Object.values(UsageRecordCategoryMap).forEach(k => {
        expect(locks[k]?.locked).toBe(false);
      });
    });
  });
});
