import {faker} from '@faker-js/faker';
import {IFile} from '../../../definitions/file';
import {AppResourceType} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

export function generateTestFile(
  extra: Partial<IFile> & {parentId: string | null} = {parentId: null}
) {
  const id = getNewIdForResource(AppResourceType.File);
  const name = faker.lorem.words();
  const createdAt = getTimestamp();
  const file: IFile = {
    name,
    createdAt,
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: createdAt,
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

export function generateTestFiles(
  count = 20,
  extra: Partial<IFile> & {parentId: string | null} = {parentId: null}
) {
  const files: IFile[] = [];
  for (let i = 0; i < count; i++) {
    files.push(generateTestFile(extra));
  }
  return files;
}

export async function generateAndInsertTestFiles(
  ctx: IBaseContext,
  count = 20,
  extra: Partial<IFile> & {parentId: string | null} = {parentId: null}
) {
  const items = generateTestFiles(count, extra);
  await executeWithMutationRunOptions(ctx, async opts => ctx.semantic.file.insertItem(items, opts));
  return items;
}
