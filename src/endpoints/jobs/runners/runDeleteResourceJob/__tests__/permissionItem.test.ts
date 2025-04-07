import {afterAll, beforeAll, describe, test} from 'vitest';
import {PermissionItem} from '../../../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertPermissionItemListForTest} from '../../../../testHelpers/generate/permissionItem.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deletePermissionItemCascadeEntry} from '../permissionItem.js';
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

const permissionItemGenerateTypeChildren: GenerateTypeChildrenDefinition<PermissionItem> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<PermissionItem> = async ({
  workspaceId,
}) => {
  const [permissionItem] = await generateAndInsertPermissionItemListForTest(1, {
    workspaceId,
  });
  return permissionItem;
};

describe('runDeleteResourceJob, permission item', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: permissionItemGenerateTypeChildren,
      deleteCascadeDef: deletePermissionItemCascadeEntry,
      type: kFimidaraResourceType.PermissionItem,
    });
  });
});
