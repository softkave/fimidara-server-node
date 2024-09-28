import assert from 'assert';
import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../../../contexts/injection/injectables.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {User} from '../../../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../../../utils/agent.js';
import {extractResourceIdList} from '../../../../../utils/fns.js';
import {getNewIdForResource} from '../../../../../utils/resource.js';
import {assignWorkspaceToUser} from '../../../../assignedItems/addAssignedItems.js';
import {generateAndInsertCollaboratorListForTest} from '../../../../testUtils/generate/collaborator.js';
import {generateAndInsertTestFiles} from '../../../../testUtils/generate/file.js';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup.js';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {deleteCollaboratorCascadeEntry} from '../collaborator.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
} from './testUtils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const collaboratorGenerateTypeChildren: GenerateTypeChildrenDefinition<User> = {
  ...noopGenerateTypeChildren,
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.AssignedItem]: async ({resource, workspaceId}) =>
    flatten(
      await Promise.all([
        generateAndInsertAssignedItemListForTest(2, {
          workspaceId,
          assigneeId: resource.resourceId,
        }),
      ])
    ),
};

const genResourceFn: GenerateResourceFn<User> = async ({workspaceId}) => {
  const [collaborator] = await generateAndInsertCollaboratorListForTest(
    kSystemSessionAgent,
    workspaceId,
    /** count */ 1
  );
  return collaborator;
};

async function findWorkspaceCollaboratorAssignedItem(
  id: string,
  workspaceId: string
) {
  const assignedItems = await kSemanticModels
    .assignedItem()
    .getUserWorkspaces(id);
  return assignedItems.find(item => item.workspaceId === workspaceId);
}

async function generateNonWorkspaceResources(id: string) {
  const otherWorkspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
  const [pItems, files] = await Promise.all([
    generateAndInsertPermissionItemListForTest(2, {entityId: id}),
    generateAndInsertTestFiles(2, {
      workspaceId: otherWorkspaceId,
      parentId: null,
    }),
    kSemanticModels
      .utils()
      .withTxn(opts =>
        assignWorkspaceToUser(kSystemSessionAgent, otherWorkspaceId, id, opts)
      ),
  ]);

  const assignedItem = findWorkspaceCollaboratorAssignedItem(
    id,
    otherWorkspaceId
  );
  assert(assignedItem);

  return {assignedItem, pItems, files, otherWorkspaceId};
}

async function expectNonWorkspaceUserResourcesRemain(
  id: string,

  resources: Awaited<ReturnType<typeof generateNonWorkspaceResources>>
) {
  const {pItems, files, otherWorkspaceId} = resources;
  const [dbAssignedItem, dbPItems, dbFiles] = await Promise.all([
    findWorkspaceCollaboratorAssignedItem(id, otherWorkspaceId),
    kSemanticModels
      .permissionItem()
      .getManyByIdList(extractResourceIdList(pItems)),
    kSemanticModels.file().getManyByIdList(extractResourceIdList(files)),
  ]);

  expect(dbAssignedItem).toBeTruthy();
  expect(dbFiles.length).toBeGreaterThan(0);
  expect(dbPItems.length).toBeGreaterThan(0);
}

describe('runDeleteResourceJob, agent token', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const collaborator = await genResourceFn({workspaceId});
    const nonWorkspaceResources = await generateNonWorkspaceResources(
      collaborator.resourceId
    );

    await testDeleteResourceArtifactsJob({
      genResourceFn: () => Promise.resolve(collaborator),
      genWorkspaceFn: () => Promise.resolve(workspaceId),
      genChildrenDef: collaboratorGenerateTypeChildren,
      deleteCascadeDef: deleteCollaboratorCascadeEntry,
      type: kFimidaraResourceType.User,
      // getResourceFn: async () => {
      //   const assignedItems = await kSemanticModels
      //     .assignedItem()
      //     .getUserWorkspaces(collaborator.resourceId);
      //   return assignedItems.find(item => item.workspaceId === workspaceId);
      // },
    });

    await expectNonWorkspaceUserResourcesRemain(
      collaborator.resourceId,
      nonWorkspaceResources
    );

    const dbUser = await kSemanticModels
      .user()
      .getOneById(collaborator.resourceId);
    expect(dbUser).toBeTruthy();

    await expectNonWorkspaceUserResourcesRemain(
      collaborator.resourceId,
      nonWorkspaceResources
    );
  });
});
