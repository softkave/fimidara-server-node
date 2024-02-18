import assert from 'assert';
import {flatten} from 'lodash';
import {Resource, kAppResourceType} from '../../../../../definitions/system';
import {User} from '../../../../../definitions/user';
import {kSystemSessionAgent} from '../../../../../utils/agent';
import {extractResourceIdList} from '../../../../../utils/fns';
import {getNewIdForResource} from '../../../../../utils/resource';
import {assignWorkspaceToUser} from '../../../../assignedItems/addAssignedItems';
import {kSemanticModels} from '../../../../contexts/injection/injectables';
import {generateAndInsertCollaboratorListForTest} from '../../../../testUtils/generate/collaborator';
import {generateAndInsertTestFiles} from '../../../../testUtils/generate/file';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteCollaboratorCascadeEntry} from '../collaborator';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
} from './testUtils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const collaboratorGenerateTypeChildren: GenerateTypeChildrenDefinition<User> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kAppResourceType.AssignedItem]: async ({resource, workspaceId}) =>
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

async function findWorkspaceCollaboratorAssignedItem(id: string, workspaceId: string) {
  const assignedItems = await kSemanticModels.assignedItem().getUserWorkspaces(id);
  return assignedItems.find(item => item.workspaceId === workspaceId);
}

async function generateNonWorkspaceResources(id: string) {
  const otherWorkspaceId = getNewIdForResource(kAppResourceType.Workspace);
  const [pItems, files] = await Promise.all([
    generateAndInsertPermissionItemListForTest(2, {entityId: id}),
    generateAndInsertTestFiles(2, {workspaceId: otherWorkspaceId, parentId: null}),
    kSemanticModels
      .utils()
      .withTxn(opts =>
        assignWorkspaceToUser(kSystemSessionAgent, otherWorkspaceId, id, opts)
      ),
  ]);

  const assignedItem = findWorkspaceCollaboratorAssignedItem(id, otherWorkspaceId);
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
    kSemanticModels.permissionItem().getManyByIdList(extractResourceIdList(pItems)),
    kSemanticModels.file().getManyByIdList(extractResourceIdList(files)),
  ]);

  expect(dbAssignedItem).toBeTruthy();
  expect(dbFiles.length).toBeGreaterThan(0);
  expect(dbPItems.length).toBeGreaterThan(0);
}

describe('runDeleteResourceJob, agent token', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kAppResourceType.User,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const collaborator = await genResourceFn({workspaceId});
    const nonWorkspaceResources = await generateNonWorkspaceResources(
      collaborator.resourceId
    );

    await testDeleteResourceArtifactsJob({
      genResourceFn: () => Promise.resolve(collaborator),
      genWorkspaceFn: () => Promise.resolve(workspaceId),
      genChildrenDef: collaboratorGenerateTypeChildren,
      deleteCascadeDef: deleteCollaboratorCascadeEntry,
      type: kAppResourceType.User,
      //  db assigned item resource would be deleted in delete artifacts so skip
      //  check DB resource, cause that'd always fail
      skipCheckDbResource: true,
    });

    await expectNonWorkspaceUserResourcesRemain(
      collaborator.resourceId,
      nonWorkspaceResources
    );
  });

  test('runDeleteResourceJobSelf', async () => {
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const collaborator = await genResourceFn({workspaceId});
    const nonWorkspaceResources = await generateNonWorkspaceResources(
      collaborator.resourceId
    );

    await testDeleteResourceSelfJob<Resource>({
      type: kAppResourceType.User,
      genResourceFn: () => Promise.resolve(collaborator),
      genWorkspaceFn: () => Promise.resolve(workspaceId),
      getResourceFn: async () => {
        const assignedItems = await kSemanticModels
          .assignedItem()
          .getUserWorkspaces(collaborator.resourceId);
        return assignedItems.find(item => item.workspaceId === workspaceId);
      },
    });

    const dbUser = await kSemanticModels.user().getOneById(collaborator.resourceId);
    expect(dbUser).toBeTruthy();

    await expectNonWorkspaceUserResourcesRemain(
      collaborator.resourceId,
      nonWorkspaceResources
    );
  });
});
