import {PermissionGroup} from '../../../../../definitions/permissionGroups';
import {kAppResourceType} from '../../../../../definitions/system';
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
    [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
    [kAppResourceType.AssignedItem]: generateAssignedItemsAsChildren,
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
      type: kAppResourceType.PermissionGroup,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: permissionGroupGenerateTypeChildren,
      deleteCascadeDef: deletePermissionGroupCascadeEntry,
      type: kAppResourceType.PermissionGroup,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.PermissionGroup,
    });
  });
});
