import {faker} from '@faker-js/faker';
import {IFile} from '../../../definitions/file';
import {AppResourceType, systemAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getNewIdForResource} from '../../../utils/resourceId';

export function generateTestFile(
  workspace: Pick<IWorkspace, 'rootname' | 'resourceId'>,
  extra: Partial<IFile> = {}
) {
  const id = getNewIdForResource(AppResourceType.File);
  const name = faker.lorem.words();
  const createdAt = faker.date.past();
  const file: IFile = {
    name,
    createdAt,
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
    createdBy: systemAgent,
    lastUpdatedAt: faker.date.past(createdAt.valueOf()),
    lastUpdatedBy: systemAgent,
    idPath: [id],
    namePath: [name],
    resourceId: id,
    size: faker.datatype.number(),
    workspaceId: workspace.resourceId,
    extension: faker.system.fileExt(),
    ...extra,
  };

  return file;
}

export function generateTestFiles(
  workspace: Pick<IWorkspace, 'rootname' | 'resourceId'>,
  count = 20,
  extra: Partial<IFile> = {}
) {
  const files: IFile[] = [];
  for (let i = 0; i < count; i++) {
    files.push(generateTestFile(workspace, extra));
  }

  return files;
}
