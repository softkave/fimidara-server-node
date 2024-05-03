import {PermissionItem} from '../../../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {deletePermissionItemCascadeEntry} from '../permissionItem.js';
import {test, beforeAll, afterAll, describe} from 'vitest';
import {
  GenerateResourceFn,
  GenerateTypeChildrenDefinition,
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

const permissionItemGenerateTypeChildren: GenerateTypeChildrenDefinition<PermissionItem> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  };

const genResourceFn: GenerateResourceFn<PermissionItem> = async ({workspaceId}) => {
  const [permissionItem] = await generateAndInsertPermissionItemListForTest(1, {
    workspaceId,
  });
  return permissionItem;
};

describe('runDeleteResourceJob, permission item', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.PermissionItem,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: permissionItemGenerateTypeChildren,
      deleteCascadeDef: deletePermissionItemCascadeEntry,
      type: kFimidaraResourceType.PermissionItem,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.PermissionItem,
    });
  });
});
