import {PermissionItem} from '../../../../../definitions/permissionItem';
import {kFimidaraResourceType} from '../../../../../definitions/system';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deletePermissionItemCascadeEntry} from '../permissionItem';
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
