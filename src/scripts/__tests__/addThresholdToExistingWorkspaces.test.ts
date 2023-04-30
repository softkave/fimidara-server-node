import {faker} from '@faker-js/faker';
import {forEach} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getWorkspaceModel} from '../../db/workspace';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {Workspace} from '../../definitions/workspace';
import {disposeApplicationGlobalUtilities} from '../../endpoints/globalUtils';
import {generateWorkspaceListForTest} from '../../endpoints/testUtils/generateData/workspace';
import {dropMongoConnection} from '../../endpoints/testUtils/helpers/mongo';
import {getDefaultThresholds} from '../../endpoints/usageRecords/constants';
import {getAppVariables, prodEnvsSchema} from '../../resources/vars';
import {cast} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {script_AddThresholdToExistingWorkspaces} from '../addThresholdToExistingWorkspaces';
import assert = require('assert');

let connection: Connection | null = null;
let dbName: string | null = null;

beforeAll(async () => {
  const appVariables = getAppVariables(prodEnvsSchema);
  dbName = faker.lorem.words(5).replace(/ /g, '_');
  connection = await getMongoConnection(appVariables.mongoDbURI, dbName);
});

afterAll(async () => {
  await disposeApplicationGlobalUtilities();
  if (connection) {
    await dropMongoConnection(connection);
  }
});

function assertThresholds(
  ut1: Workspace['usageThresholds'] = {},
  ut2: Workspace['usageThresholds'] = {}
) {
  Object.values(UsageRecordCategory).forEach(category => {
    const threshold1 = ut1[category];
    const threshold2 = ut2[category];
    expect(threshold1?.budget).toBe(threshold2?.budget);
  });
}

describe('addThresholdToExistingWorkspaces', () => {
  test('adds usage thresholds to existing workspaces', async () => {
    // setup
    const workspaces = generateWorkspaceListForTest(20);

    // without usage thresholds
    const workspaces01 = workspaces.slice(0, 10);
    forEach(workspaces01, workspace => {
      workspace.usageThresholds = {};
    });

    // with usage thresholds
    const workspaces02 = workspaces.slice(10, 20);
    assert(connection);
    const model = getWorkspaceModel(connection);
    await model.insertMany(workspaces);

    // run
    await script_AddThresholdToExistingWorkspaces(connection);

    // verify
    const dbWorkspaces = await model
      .find({
        resourceId: {$in: workspaces.map(w => w.resourceId)},
      })
      .lean()
      .exec();

    const defaultThresholds = getDefaultThresholds();

    // delete lastUpdatedAt cause it's going to be different each time
    if (defaultThresholds[UsageRecordCategory.Total]) {
      delete cast<any>(defaultThresholds[UsageRecordCategory.Total]).lastUpdatedAt;
    }

    const dbWorkspacesMap = indexArray(dbWorkspaces, {path: 'resourceId'});

    // assert that workspaces with usage thresholds are unchanged
    forEach(workspaces02, workspace => {
      const dbWorkspace = dbWorkspacesMap[workspace.resourceId];
      assert(dbWorkspace);
      assertThresholds(dbWorkspace.usageThresholds, workspace.usageThresholds);
    });

    // assert that workspaces without usage thresholds are updated
    forEach(workspaces01, workspace => {
      const dbWorkspace = dbWorkspacesMap[workspace.resourceId];
      assert(dbWorkspace);
      assertThresholds(dbWorkspace.usageThresholds, defaultThresholds);
    });
  });
});
