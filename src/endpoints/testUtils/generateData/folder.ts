import {faker} from '@faker-js/faker';
import {Folder} from '../../../definitions/folder';
import {AppResourceType} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getRandomIntInclusive} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';

export function generateTestFolderName(
  {separatorChars}: {separatorChars: string[]} = {separatorChars: ['-', '_', ' ', '.']}
) {
  const wordCount = getRandomIntInclusive(3, 10);
  const separator = faker.helpers.arrayElement(separatorChars);
  return faker.lorem.words(wordCount).split(' ').join(separator);
}

export function generateTestFolder(
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null}
) {
  const id = getNewIdForResource(AppResourceType.Folder);
  const name = generateTestFolderName();
  const createdAt = getTimestamp();
  const folder: Folder = {
    name,
    createdAt,
    description: faker.lorem.paragraph(),
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
    idPath: [id],
    namePath: [name],
    resourceId: id,
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    ...extra,
  };
  return folder;
}

export function generateTestFolders(
  count = 20,
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null}
) {
  const folders: Folder[] = [];
  for (let i = 0; i < count; i++) {
    folders.push(generateTestFolder(extra));
  }
  return folders;
}

export async function generateAndInsertTestFolders(
  ctx: BaseContextType,
  count = 20,
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null}
) {
  const items = generateTestFolders(count, extra);
  await executeWithMutationRunOptions(ctx, async opts =>
    ctx.semantic.folder.insertItem(items, opts)
  );
  return items;
}
