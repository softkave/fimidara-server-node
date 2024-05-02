import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {Tag} from '../../../../../definitions/tag.js';
import {generateAndInsertTagListForTest} from '../../../../testUtils/generate/tag.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {deleteTagCascadeEntry} from '../tag.js';
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

const tagGenerateTypeChildren: GenerateTypeChildrenDefinition<Tag> = {
  ...noopGenerateTypeChildren,
  [kFimidaraResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kFimidaraResourceType.AssignedItem]: generateAssignedItemsAsChildren,
};
const genResourceFn: GenerateResourceFn<Tag> = async ({workspaceId}) => {
  const [tag] = await generateAndInsertTagListForTest(1, {
    workspaceId,
  });
  return tag;
};

describe('runDeleteResourceJob, tag', () => {
  test('deleteResource0', async () => {
    testDeleteResourceJob0({
      genResourceFn,
      type: kFimidaraResourceType.Tag,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: tagGenerateTypeChildren,
      deleteCascadeDef: deleteTagCascadeEntry,
      type: kFimidaraResourceType.Tag,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kFimidaraResourceType.Tag,
    });
  });
});
