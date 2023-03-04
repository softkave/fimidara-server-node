import {faker} from '@faker-js/faker';
import {IFile} from '../../../definitions/file';
import {AppResourceType, SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {getDate} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateTestFile(extra: Partial<IFile> = {}) {
  const id = getNewIdForResource(AppResourceType.File);
  const name = faker.lorem.words();
  const createdAt = getDate();
  const file: IFile = {
    name,
    createdAt,
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: faker.date.future(),
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
    idPath: [id],
    namePath: [name],
    resourceId: id,
    size: faker.datatype.number({min: 1}),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    extension: faker.system.fileExt(),
    ...extra,
  };

  return file;
}

export function generateTestFiles(count = 20, extra: Partial<IFile> = {}) {
  const files: IFile[] = [];
  for (let i = 0; i < count; i++) {
    files.push(generateTestFile(extra));
  }
  return files;
}

export async function generateAndInsertTestFiles(
  ctx: IBaseContext,
  count = 20,
  extra: Partial<IFile> = {}
) {
  const items = generateTestFiles(count, extra);
  await ctx.semantic.file.insertList(items);
  return items;
}
