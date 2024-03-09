import {PermissionGroup} from '../../../../../definitions/permissionGroups';
import {kFimidaraResourceType} from '../../../../../definitions/system';
import {generateAndInsertPermissionGroupListForTest} from '../../../../testUtils/generate/permissionGroup';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deletePermissionGroupCascadeEntry} from '../permissionGroup';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generateAssignedItemsAsChildren,
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
