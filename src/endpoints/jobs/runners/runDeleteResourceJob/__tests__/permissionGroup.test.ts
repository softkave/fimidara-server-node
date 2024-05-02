import {PermissionGroup} from '../../../../../definitions/permissionGroups.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertPermissionGroupListForTest} from '../../../../testUtils/generate/permissionGroup.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {deletePermissionGroupCascadeEntry} from '../permissionGroup.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generateAssignedItemsAsChildren,
  generatePermissionItemsAsChildren,
  noopGenerateTypeChildren,
  testDeleteResourceArtifactsJob,
  testDeleteResourceJob0,
  testDeleteResourceSelfJob,
} from './testUtils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const permissionGroupGenerateTypeChildren: GenerateTypeChildrenDefinition<PermissionGroup> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
    [kFimidaraResourceType.AssignedItem]: generateAssignedItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<PermissionGroup> = async ({workspaceId}) => {
  const [permissionGroup] = await generateAndInsertPermissionGroupListForTest(1, {
    workspaceId,
  });
  return permissionGroup;
};

describe('runDeleteResourceJob, permission group', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.PermissionGroup,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: permissionGroupGenerateTypeChildren,
      deleteCascadeDef: deletePermissionGroupCascadeEntry,
      type: kFimidaraResourceType.PermissionGroup,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.PermissionGroup,
    });
  });
});
