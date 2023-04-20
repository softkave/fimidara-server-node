import {faker} from '@faker-js/faker';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getWorkspaceModel} from '../../db/workspace';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {Workspace} from '../../definitions/workspace';
import {generateWorkspaceListForTest} from '../../endpoints/testUtils/generateData/workspace';
import {dropMongoConnection} from '../../endpoints/testUtils/helpers/mongo';
import {completeTest} from '../../endpoints/testUtils/helpers/test';
import {extractEnvVariables, extractProdEnvsSchema} from '../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {getTimestamp} from '../../utils/dateFns';
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
  await completeTest();
  if (connection) {
    await dropMongoConnection(connection);
  }
});

describe('unlockUsageThresholds', () => {
  test('usage thresholds unlocked', async () => {
    // setup
    const workspaces = generateWorkspaceListForTest(10);
    const locks: Workspace['usageThresholdLocks'] = {};
    Object.values(UsageRecordCategory).forEach(k => {
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
      Object.values(UsageRecordCategory).forEach(k => {
        expect(locks[k]?.locked).toBe(false);
      });
    });
  });
});
