import {faker} from '@faker-js/faker';
import assert from 'assert';
import {forEach} from 'lodash';
import {Connection} from 'mongoose';
import {getMongoConnection} from '../../db/connection';
import {getWorkspaceModel} from '../../db/workspace';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {generateTestWorkspaces} from '../../endpoints/test-utils/generate-data/workspace';
import {getTestVars} from '../../endpoints/test-utils/vars';
import {getDefaultThresholds} from '../../endpoints/usageRecords/constants';
import cast from '../../utilities/fns';
import {indexArray} from '../../utilities/indexArray';
import {script_AddThresholdToExistingWorkspaces} from '../addThresholdToExistingWorkspaces';

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

describe('addThresholdToExistingWorkspaces', () => {
  test('adds usage thresholds to existing workspaces', async () => {
    // setup
    const workspaces = generateTestWorkspaces(20);

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
      delete cast<any>(defaultThresholds[UsageRecordCategory.Total])
        .lastUpdatedAt;
    }

    const dbWorkspacesMap = indexArray(dbWorkspaces, {path: 'resourceId'});

    // assert that workspaces with usage thresholds are unchanged
    forEach(workspaces02, workspace => {
      const dbWorkspace = dbWorkspacesMap[workspace.resourceId];
      assert(dbWorkspace);
      expect(dbWorkspace.usageThresholds).toMatchObject(
        workspace.usageThresholds || {}
      );
    });

    // assert that workspaces without usage thresholds are updated
    forEach(workspaces01, workspace => {
      const dbWorkspace = dbWorkspacesMap[workspace.resourceId];
      assert(dbWorkspace);
      expect(dbWorkspace.usageThresholds).toMatchObject(defaultThresholds);
    });
  });
});
