import assert = require('assert');
import * as faker from 'faker';
import {sortBy} from 'lodash';
import {Connection, Model} from 'mongoose';
import {getMongoConnection} from '../../../../db/connection';
import {getWorkspaceModel, IWorkspaceDocument} from '../../../../db/workspace';
import {IWorkspace} from '../../../../definitions/workspace';
import {SessionAgentType} from '../../../../definitions/system';
import {getDateString} from '../../../../utilities/dateFns';
import getNewId from '../../../../utilities/getNewId';
import {NotFoundError} from '../../../errors';
import WorkspaceQueries from '../../../workspaces/queries';
import {
  workspaceExtractor,
  workspaceListExtractor,
  throwWorkspaceNotFound,
} from '../../../workspaces/utils';
import {
  generateWorkspace,
  generateWorkspaces,
} from '../../../test-utils/generate-data/workspace';
import {getTestVars} from '../../../test-utils/vars';
import MongoDataProvider from '../MongoDataProvider';

// Using workspace for the tests

let connection: Connection | null = null;

beforeAll(async () => {
  const testVars = getTestVars();
  connection = await getMongoConnection(
    testVars.mongoDbURI,
    testVars.mongoDbDatabaseName
  );
});

afterAll(async () => {
  assert(connection);

  await connection.close();
});

async function insertWorkspaceMongo(
  workspaceModel: Model<IWorkspaceDocument>,
  workspace?: IWorkspace
) {
  workspace = workspace || generateWorkspace();
  const doc = new workspaceModel(workspace);
  await doc.save();
  return workspace;
}

async function insertWorkspacesMongo(
  workspaceModel: Model<IWorkspaceDocument>,
  count = 20,
  workspaces?: IWorkspace[]
) {
  workspaces = workspaces || generateWorkspaces(count);
  await workspaceModel.insertMany(workspaces);
  return workspaces;
}

export async function getWorkspaceMongoProviderForTest() {
  if (!connection) {
    throw new Error('Mongo connection not established');
  }

  const workspaceModel = getWorkspaceModel(connection);
  const provider = new MongoDataProvider(
    workspaceModel,
    throwWorkspaceNotFound
  );
  return {provider, workspaceModel};
}

async function getMatchedWorkspacesCount(
  workspaceModel: Model<IWorkspaceDocument>,
  workspaces: IWorkspace[]
) {
  return await workspaceModel
    .countDocuments({
      resourceId: {$in: workspaces.map(item => item.resourceId)},
    })
    .exec();
}

describe('MongoDataProvider', () => {
  test('checkItemExists is true when item exists', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const workspace = await insertWorkspaceMongo(workspaceModel);
    const exists = await provider.checkItemExists(
      WorkspaceQueries.getByName(workspace.name)
    );

    expect(exists).toBeTruthy();
  });

  test('checkItemExists is false when item not found', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();

    // Inserting data for blank tests so that we can know
    // definitely that it's returning blank because the filter matches nothing
    // and not because there's no data
    await insertWorkspaceMongo(workspaceModel);
    const exists = await provider.checkItemExists(
      WorkspaceQueries.getById(getNewId())
    );

    expect(exists).toBeFalsy();
  });

  test('getItem when item exists', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const workspace = await insertWorkspaceMongo(workspaceModel);
    const result = await provider.getItem(
      WorkspaceQueries.getById(workspace.resourceId)
    );

    assert(result);
    expect(workspace).toMatchObject(workspaceExtractor(result));
  });

  test('getItem when does not item exists', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    await insertWorkspaceMongo(workspaceModel);
    const result = await provider.getItem(WorkspaceQueries.getById(getNewId()));

    expect(result).toBeFalsy();
  });

  test('getManyItems returns items', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const workspace01 = await insertWorkspaceMongo(workspaceModel);
    const workspace02 = await insertWorkspaceMongo(workspaceModel);
    const workspace03 = await insertWorkspaceMongo(workspaceModel);
    const workspace04 = await insertWorkspaceMongo(workspaceModel);
    const workspace05 = await insertWorkspaceMongo(workspaceModel);
    const result = await provider.getManyItems(
      WorkspaceQueries.getByIds([
        workspace01.resourceId,
        workspace02.resourceId,
        workspace03.resourceId,
        workspace04.resourceId,
        workspace05.resourceId,
      ])
    );

    const s1 = sortBy(workspaceListExtractor(result), ['resourceId']);
    const s2 = sortBy(
      [workspace01, workspace02, workspace03, workspace04, workspace05],
      ['resourceId']
    );
    expect(result).toHaveLength(5);
    expect(s1[0]).toMatchObject(s2[0]);
    expect(s1[1]).toMatchObject(s2[1]);
    expect(s1[2]).toMatchObject(s2[2]);
    expect(s1[3]).toMatchObject(s2[3]);
    expect(s1[4]).toMatchObject(s2[4]);
  });

  test('getManyItems returns nothing', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    await insertWorkspacesMongo(workspaceModel);
    const result = await provider.getManyItems(
      WorkspaceQueries.getByIds([getNewId(), getNewId()])
    );

    expect(result).toHaveLength(0);
  });

  test('deleteItem deleted correct items', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const [workspace01, ...workspaces] = await insertWorkspacesMongo(
      workspaceModel,
      10
    );
    await provider.deleteItem(WorkspaceQueries.getById(workspace01.resourceId));

    expect(await getMatchedWorkspacesCount(workspaceModel, workspaces)).toBe(9);
    expect(
      await provider.checkItemExists(
        WorkspaceQueries.getById(workspace01.resourceId)
      )
    ).toBeFalsy();
  });

  test('deleteItem deleted nothing', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const workspaces = await insertWorkspacesMongo(workspaceModel, 10);
    await provider.deleteItem(
      WorkspaceQueries.getByIds([getNewId(), getNewId()])
    );

    expect(await getMatchedWorkspacesCount(workspaceModel, workspaces)).toBe(
      10
    );
  });

  test('updateItem correct item', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const [workspace01] = await insertWorkspacesMongo(workspaceModel, 10);
    const workspaceUpdate: Partial<IWorkspace> = {
      lastUpdatedBy: {
        agentId: getNewId(),
        agentType: SessionAgentType.User,
      },
      lastUpdatedAt: getDateString(),
      name: faker.lorem.word(),
      description: faker.lorem.paragraph(),
    };

    const result = await provider.updateItem(
      WorkspaceQueries.getById(workspace01.resourceId),
      workspaceUpdate
    );

    const updatedWorkspace = await provider.assertGetItem(
      WorkspaceQueries.getById(workspace01.resourceId)
    );

    expect(result).toEqual(updatedWorkspace);
    expect(workspaceExtractor(updatedWorkspace)).toMatchObject(workspaceUpdate);
  });

  test('updateItem update nothing', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    await insertWorkspacesMongo(workspaceModel, 10);
    const result = await provider.updateItem(
      WorkspaceQueries.getById('009'),
      {}
    );

    expect(result).toBeFalsy();
  });

  test('updateManyItems updated correct items', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const [workspace01, workspace02] = await insertWorkspacesMongo(
      workspaceModel,
      10
    );
    const workspaceUpdate: Partial<IWorkspace> = {
      lastUpdatedBy: {
        agentId: getNewId(),
        agentType: SessionAgentType.User,
      },
      lastUpdatedAt: getDateString(),
      name: faker.lorem.word(),
      description: faker.lorem.paragraph(),
    };

    await provider.updateManyItems(
      WorkspaceQueries.getByIds([
        workspace01.resourceId,
        workspace02.resourceId,
      ]),
      workspaceUpdate
    );

    const updatedWorkspaces = await provider.getManyItems(
      WorkspaceQueries.getByIds([
        workspace01.resourceId,
        workspace02.resourceId,
      ])
    );

    expect(workspaceExtractor(updatedWorkspaces[0])).toMatchObject(
      workspaceUpdate
    );
    expect(workspaceExtractor(updatedWorkspaces[1])).toMatchObject(
      workspaceUpdate
    );
  });

  test('assertUpdateItem throws when item not found', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    await insertWorkspacesMongo(workspaceModel, 10);

    try {
      await provider.updateItem(WorkspaceQueries.getById(getNewId()), {});
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('deleteManyItems', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const [workspace01, workspace02, ...workspaces] =
      await insertWorkspacesMongo(workspaceModel, 10);

    await provider.deleteManyItems(
      WorkspaceQueries.getByIds([
        workspace01.resourceId,
        workspace02.resourceId,
      ])
    );

    expect(await getMatchedWorkspacesCount(workspaceModel, workspaces)).toBe(8);
  });

  test('assertItemExists', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    await insertWorkspacesMongo(workspaceModel, 10);

    try {
      await provider.assertItemExists(WorkspaceQueries.getById(getNewId()));
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('assertGetItem', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    await insertWorkspacesMongo(workspaceModel, 10);

    try {
      await provider.assertGetItem(WorkspaceQueries.getById(getNewId()));
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('saveItem', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const workspace = generateWorkspace();
    await provider.saveItem(workspace);
    expect(await getMatchedWorkspacesCount(workspaceModel, [workspace])).toBe(
      1
    );
  });

  test('bulkSaveItems', async () => {
    const {provider, workspaceModel} = await getWorkspaceMongoProviderForTest();
    const workspaces = generateWorkspaces(10);
    await provider.bulkSaveItems(workspaces);
    expect(await getMatchedWorkspacesCount(workspaceModel, workspaces)).toBe(
      10
    );
  });
});
