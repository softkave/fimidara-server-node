import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {FileBackendMount} from '../../../../../definitions/fileBackend.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {
  generateAndInsertFileBackendMountListForTest,
  generateAndInsertResolvedMountEntryListForTest,
} from '../../../../testHelpers/generate/fileBackend.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {deleteFileBackendMountCascadeEntry} from '../fileBackendMount.js';
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

const fileBackendMountGenerateTypeChildren: GenerateTypeChildrenDefinition<FileBackendMount> =
  {
    ...noopGenerateTypeChildren,
    [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
    [kFimidaraResourceType.ResolvedMountEntry]: async ({
      resource,
      workspaceId,
    }) =>
      flatten(
        await Promise.all([
          generateAndInsertResolvedMountEntryListForTest(2, {
            workspaceId,
            mountId: resource.resourceId,
          }),
        ])
      ),
  };

const genResourceFn: GenerateResourceFn<FileBackendMount> = async ({
  workspaceId,
}) => {
  const [fileBackendMount] = await generateAndInsertFileBackendMountListForTest(
    1,
    {
      workspaceId,
    }
  );
  return fileBackendMount;
};

describe('runDeleteResourceJob, file backend mount', () => {
  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: fileBackendMountGenerateTypeChildren,
      deleteCascadeDef: deleteFileBackendMountCascadeEntry,
      type: kFimidaraResourceType.FileBackendMount,
    });
  });
});
