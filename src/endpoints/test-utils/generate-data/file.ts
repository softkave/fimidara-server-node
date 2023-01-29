import {faker} from '@faker-js/faker';
import {IFile} from '../../../definitions/file';
import {AppResourceType, systemAgent} from '../../../definitions/system';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateTestFile(extra: Partial<IFile> = {}) {
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

export async function generateAndInsertTestFiles(ctx: IBaseContext, count = 20, extra: Partial<IFile> = {}) {
  const items = generateTestFiles(count, extra);
  await ctx.data.file.insertList(items);
  return items;
}
