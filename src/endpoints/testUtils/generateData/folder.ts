import {faker} from '@faker-js/faker';
import {Folder} from '../../../definitions/folder';
import {AppResourceType} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getRandomIntInclusive} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';

export function generateTestFolderName(
  {separatorChars}: {separatorChars: string[]} = {separatorChars: ['-', '_', ' ', '.']}
) {
  const wordCount = getRandomIntInclusive(3, 10);
  const separator = faker.helpers.arrayElement(separatorChars);
  return faker.lorem
    .words(wordCount)
    .split(' ')
    .map(word =>
      /** introduce a little randomness in the name, mixing uppercase and
       * lowercase characters to test that names are matched case-insensitively.
       * */
      getRandomIntInclusive(1, 2) === 1 ? word : word.toUpperCase()
    )
    .join(separator);
}

export function generateTestFolder(
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null},
  other: {parentNamePath?: string[]; parentIdPath?: string[]} = {}
) {
  const id = getNewIdForResource(AppResourceType.Folder);
  const name = generateTestFolderName();
  const namePath = other.parentNamePath ? other.parentNamePath.concat(name) : [name];
  const idPath = other.parentIdPath
    ? other.parentIdPath.concat(id)
    : extra.parentId
    ? [extra.parentId, id]
    : [id];
  const createdAt = getTimestamp();
  const folder: Folder = {
    name,
    createdAt,
    namePath,
    idPath,
    description: faker.lorem.paragraph(),
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
    resourceId: id,
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    ...extra,
  };
  return folder;
}

export function generateTestFolders(
  count = 20,
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null},
  other: Parameters<typeof generateTestFolder>[1] = {}
) {
  const folders: Folder[] = [];
  for (let i = 0; i < count; i++) {
    folders.push(generateTestFolder(extra, other));
  }
  return folders;
}

export async function generateAndInsertTestFolders(
  ctx: BaseContextType,
  count = 20,
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null},
  other: Parameters<typeof generateTestFolder>[1] = {}
) {
  const items = generateTestFolders(count, extra, other);
  await ctx.semantic.utils.withTxn(ctx, async opts => ctx.semantic.folder.insertItem(items, opts));
  return items;
}
