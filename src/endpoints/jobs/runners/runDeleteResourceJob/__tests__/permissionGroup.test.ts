import {afterAll, beforeAll, describe, test} from 'vitest';
import {PermissionGroup} from '../../../../../definitions/permissionGroups.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertPermissionGroupListForTest} from '../../../../testHelpers/generate/permissionGroup.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deletePermissionGroupCascadeEntry} from '../permissionGroup.js';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
  generateAssignedItemsAsChildren,
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

const permissionGroupGenerateTypeChildren: GenerateTypeChildrenDefinition<PermissionGroup> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
    [kFimidaraResourceType.AssignedItem]: generateAssignedItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<PermissionGroup> = async ({
  workspaceId,
}) => {
  const [permissionGroup] = await generateAndInsertPermissionGroupListForTest(
    1,
    {
      workspaceId,
    }
  );
  return permissionGroup;
};

describe('runDeleteResourceJob, permission group', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: permissionGroupGenerateTypeChildren,
      deleteCascadeDef: deletePermissionGroupCascadeEntry,
      type: kFimidaraResourceType.PermissionGroup,
    });
  });
});
