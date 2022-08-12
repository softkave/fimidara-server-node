import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {
  AppResourceType,
  SessionAgentType,
} from '../../../../definitions/system';
import {IWorkspace} from '../../../../definitions/workspace';
import {getDateString} from '../../../../utilities/dateFns';
import {getNewIdForResource} from '../../../../utilities/resourceId';
import {NotFoundError} from '../../../errors';
import {
  generateTestWorkspace,
  generateTestWorkspaces,
} from '../../../test-utils/generate-data/workspace';
import WorkspaceQueries from '../../../workspaces/queries';
import {throwWorkspaceNotFound} from '../../../workspaces/utils';
import MemoryDataProvider from '../MemoryDataProvider';

// Using workspace for the tests
function insertWorkspaceMemory(data: IWorkspace[], workspace?: IWorkspace) {
  workspace = workspace || generateTestWorkspace();
  data.push(workspace);
  return workspace;
}

function insertWorkspacesMemory(
  data: IWorkspace[],
  count = 20,
  workspaces: IWorkspace[] = []
) {
  const startIndex = data.length;
  for (let i = 0; i < count; i++) {
    insertWorkspaceMemory(data, workspaces[i]);
  }
  return data.slice(startIndex);
}

function assertListEqual(list01: IWorkspace[], list02: IWorkspace[]) {
  list01.forEach((item, index) => {
    expect(item).toEqual(list02[index]);
  });
}

describe('MemoryDataProvider', () => {
  test('checkItemExists is true when item exists', async () => {
    const data: IWorkspace[] = [];
    const workspace = insertWorkspaceMemory(data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const exists = await provider.checkItemExists(
      WorkspaceQueries.getById(workspace.resourceId)
    );

    expect(exists).toBeTruthy();
  });

  test('checkItemExists is false when item not found', async () => {
    const data: IWorkspace[] = [];

    // Inserting data for blank tests so that we can know
    // definitely that it's returning blank because the filter matches nothing
    // and not because there's no data
    await insertWorkspaceMemory(data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const exists = await provider.checkItemExists(
      WorkspaceQueries.getById(getNewIdForResource(AppResourceType.Workspace))
    );

    expect(exists).toBeFalsy();
  });

  test('getItem when item exists', async () => {
    const data: IWorkspace[] = [];
    const workspace = insertWorkspaceMemory(data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const result = await provider.getItem(
      WorkspaceQueries.getById(workspace.resourceId)
    );

    expect(result).toEqual(workspace);
  });

  test('getItem when does not item exists', async () => {
    const data: IWorkspace[] = [];
    await insertWorkspaceMemory(data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const result = await provider.getItem(
      WorkspaceQueries.getById(getNewIdForResource(AppResourceType.Workspace))
    );

    expect(result).toBeFalsy();
  });

  test('getManyItems returns items', async () => {
    const data: IWorkspace[] = [];
    const workspace01 = insertWorkspaceMemory(data);
    const workspace02 = insertWorkspaceMemory(data);
    const workspace03 = insertWorkspaceMemory(data);
    const workspace04 = insertWorkspaceMemory(data);
    const workspace05 = insertWorkspaceMemory(data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const result = await provider.getManyItems(
      WorkspaceQueries.getByIds([
        workspace01.resourceId,
        workspace02.resourceId,
        workspace03.resourceId,
        workspace04.resourceId,
        workspace05.resourceId,
      ])
    );

    expect(result).toContainEqual(workspace01);
    expect(result).toContainEqual(workspace02);
    expect(result).toContainEqual(workspace03);
    expect(result).toContainEqual(workspace04);
    expect(result).toContainEqual(workspace05);
  });

  test('getManyItems returns nothing', async () => {
    const data: IWorkspace[] = [];
    insertWorkspacesMemory(data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const result = await provider.getManyItems(
      WorkspaceQueries.getByIds([
        getNewIdForResource(AppResourceType.Workspace),
        getNewIdForResource(AppResourceType.Workspace),
      ])
    );

    expect(result).toHaveLength(0);
  });

  test('deleteItem deleted correct items', async () => {
    const data: IWorkspace[] = [];
    const [workspace01] = insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    await provider.deleteItem(WorkspaceQueries.getById(workspace01.resourceId));

    expect(provider.items).toHaveLength(9);
    expect(
      await provider.checkItemExists(
        WorkspaceQueries.getById(workspace01.resourceId)
      )
    ).toBeFalsy();
  });

  test('deleteItem deleted nothing', async () => {
    const data: IWorkspace[] = [];
    insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    await provider.deleteItem(WorkspaceQueries.getByIds(['001', '002']));

    expect(provider.items).toHaveLength(10);
  });

  test('updateItem correct item', async () => {
    const data: IWorkspace[] = [];
    const [workspace01] = insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const workspaceUpdate: Partial<IWorkspace> = {
      lastUpdatedBy: {
        agentId: getNewIdForResource(AppResourceType.User),
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
    expect(updatedWorkspace).toMatchObject(workspaceUpdate);
  });

  test('updateItem update nothing', async () => {
    const data: IWorkspace[] = [];
    insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const result = await provider.updateItem(
      WorkspaceQueries.getById('007'),
      {}
    );

    expect(result).toBeFalsy();
  });

  test('updateManyItems updated correct items', async () => {
    const data: IWorkspace[] = [];
    const [workspace01, workspace02] = insertWorkspacesMemory(data, 10);
    const data02 = merge([], data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const workspaceUpdate: Partial<IWorkspace> = {
      lastUpdatedBy: {
        agentId: getNewIdForResource(AppResourceType.User),
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

    expect(updatedWorkspaces[0]).toMatchObject(workspaceUpdate);
    expect(updatedWorkspaces[1]).toMatchObject(workspaceUpdate);
    assertListEqual(provider.items.slice(2), data02.slice(2));
  });

  test('assertUpdateItem throws when item not found', async () => {
    const data: IWorkspace[] = [];
    insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);

    try {
      await provider.updateItem(
        WorkspaceQueries.getById(
          getNewIdForResource(AppResourceType.Workspace)
        ),
        {}
      );
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('deleteManyItems', async () => {
    const data: IWorkspace[] = [];
    const [workspace01, workspace02] = insertWorkspacesMemory(data, 10);
    const data02 = merge([], data);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    await provider.deleteManyItems(
      WorkspaceQueries.getByIds([
        workspace01.resourceId,
        workspace02.resourceId,
      ])
    );

    expect(provider.items.length).toEqual(8);
    assertListEqual(provider.items, data02.slice(2));
  });

  test('assertItemExists', async () => {
    const data: IWorkspace[] = [];
    insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);

    try {
      await provider.assertItemExists(
        WorkspaceQueries.getById(getNewIdForResource(AppResourceType.Workspace))
      );
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('assertGetItem', async () => {
    const data: IWorkspace[] = [];
    insertWorkspacesMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);

    try {
      await provider.assertGetItem(
        WorkspaceQueries.getById(getNewIdForResource(AppResourceType.Workspace))
      );
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('saveItem', async () => {
    const data: IWorkspace[] = [];
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const workspace = generateTestWorkspace();
    await provider.saveItem(workspace);
    expect(provider.items).toHaveLength(1);
  });

  test('bulkSaveItems', async () => {
    const data: IWorkspace[] = [];
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    const workspaces = generateTestWorkspaces(10);
    await provider.bulkSaveItems(workspaces);
    expect(provider.items).toHaveLength(10);
  });

  test('getAll', async () => {
    const data: IWorkspace[] = [];
    const provider = new MemoryDataProvider(data, throwWorkspaceNotFound);
    insertWorkspacesMemory(data, 10);
    const everyWorkspace = await provider.getAll();
    expect(everyWorkspace.length).toBe(10);
  });
});
