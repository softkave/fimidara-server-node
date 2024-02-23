import {kAppResourceType} from '../../../../../definitions/system';
import {Tag} from '../../../../../definitions/tag';
import {generateAndInsertTagListForTest} from '../../../../testUtils/generate/tag';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {deleteTagCascadeEntry} from '../tag';
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

const tagGenerateTypeChildren: GenerateTypeChildrenDefinition<Tag> = {
  ...noopGenerateTypeChildren,
  [kAppResourceType.PermissionItem]: generatePermissionItemsAsChildren,
  [kAppResourceType.AssignedItem]: generateAssignedItemsAsChildren,
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
      type: kAppResourceType.Tag,
    });
  });

  test('runDeleteResourceJobArtifacts', async () => {
    await testDeleteResourceArtifactsJob({
      genResourceFn,
      genChildrenDef: tagGenerateTypeChildren,
      deleteCascadeDef: deleteTagCascadeEntry,
      type: kAppResourceType.Tag,
    });
  });

  test('runDeleteResourceJobSelf', async () => {
    await testDeleteResourceSelfJob({
      genResourceFn,
      type: kAppResourceType.Tag,
    });
  });
});
