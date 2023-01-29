import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getWorkspaceModel} from '../../db/workspace';
import {systemAgent} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IWorkspace} from '../../definitions/workspace';
import {justInCaseCleanups} from '../../endpoints/test-utils/context/cleanup';
import {generateWorkspaceListForTest} from '../../endpoints/test-utils/generate-data/workspace';
import {dropMongoConnection} from '../../endpoints/test-utils/helpers/mongo';
import {extractEnvVariables, extractProdEnvsSchema} from '../../resources/vars';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';
import assert = require('assert');

let connection: Connection | null = null;
let dbName: string | null = null;

beforeAll(async () => {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  dbName = faker.lorem.words(5).replace(/ /g, '_');
  connection = await getMongoConnection(appVariables.mongoDbURI, dbName);
});

afterAll(async () => {
  if (connection) {
    await dropMongoConnection(connection);
  }
  await justInCaseCleanups();
});

describe('unlockUsageThresholds', () => {
  test('usage thresholds unlocked', async () => {
    // setup
    const workspaces = generateWorkspaceListForTest(10);
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

    assert(connection);
    const model = getWorkspaceModel(connection);
    await model.insertMany(workspaces);

    // run
    await unlockUsageThresholdLocks(connection);

    // verify

    const dbWorkspaces = await model.find({}).lean().exec();
    expect(dbWorkspaces.length).toBe(workspaces.length);
    dbWorkspaces.forEach(dbWorkspace => {
      const locks = dbWorkspace.usageThresholdLocks || {};
      Object.values(UsageRecordCategory).forEach(k => {
        expect(locks[k]?.locked).toBe(false);
      });
    });
  });
});
