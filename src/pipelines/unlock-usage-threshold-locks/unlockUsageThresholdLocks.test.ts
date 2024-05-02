import {faker} from '@faker-js/faker';
import assert from 'assert';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection.js';
import {getWorkspaceModel} from '../../db/workspace.js';
import {UsageRecordCategoryMap} from '../../definitions/usageRecord.js';
import {Workspace} from '../../definitions/workspace.js';
import {kUtilsInjectables} from '../../endpoints/contexts/injection/injectables.js';
import {generateWorkspaceListForTest} from '../../endpoints/testUtils/generate/workspace.js';
import {dropMongoDBAndEndConnection} from '../../endpoints/testUtils/helpers/mongo.js';
import {completeTests} from '../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../endpoints/testUtils/testUtils.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks.js';

let connection: Connection | null = null;
let dbName: string | null = null;

beforeAll(async () => {
  initTests();
  dbName = faker.lorem.words(5).replace(/ /g, '_');
  ({connection} = await getMongoConnection(
    kUtilsInjectables.suppliedConfig().mongoDbURI!,
    dbName
  ));
});

afterAll(async () => {
  await completeTests();

  if (connection) {
    await dropMongoDBAndEndConnection(connection);
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
        lastUpdatedBy: kSystemSessionAgent,
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
