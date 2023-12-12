import {faker} from '@faker-js/faker';
import {container} from 'tsyringe';
import {Folder} from '../../../definitions/folder';
import {AppResourceTypeMap} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getRandomIntInclusive} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFolderProvider} from '../../contexts/semantic/folder/types';
import {SemanticProviderUtils} from '../../contexts/semantic/types';

export const kTestFolderNameSeparatorChars = ['-', '_', ' ', '.'];

export function generateTestFolderName(
  {
    separatorChars,
    includeStraySlashes: includeStraySeparators,
  }: {separatorChars?: string[]; includeStraySlashes?: boolean} = {
    separatorChars: kTestFolderNameSeparatorChars,
    includeStraySlashes: false,
  }
) {
  const wordCount = getRandomIntInclusive(3, 10);
  const seed = getRandomIntInclusive(1, 2);
  const separator = faker.helpers.arrayElement(
    separatorChars ?? kTestFolderNameSeparatorChars
  );
  const name = faker.lorem
    .words(wordCount)
    .split(' ')
    .map(word =>
      /** introduce a little randomness in the name, mixing uppercase and
       * lowercase characters to test that names are matched case-insensitively.
       */
      seed === 1 ? word : word.toUpperCase()
    )
    .join(separator);

  // Randomly inlcude stray separators to test that empty names are handled
  // appropriately
  return includeStraySeparators
    ? seed === 1
      ? new Array(getRandomIntInclusive(1, 3)).fill('/').join('') + name
      : name
    : name;
}

export function generateTestFolderpath(length = 3) {
  return Array(length)
    .fill(0)
    .map(() => generateTestFolderName());
}

export function generateTestFolder(
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null},
  other: {parentnamepath?: string[]; parentIdPath?: string[]} = {}
) {
  const id = getNewIdForResource(AppResourceTypeMap.Folder);
  const name = generateTestFolderName();
  const namepath = other.parentnamepath ? other.parentnamepath.concat(name) : [name];
  const idPath = other.parentIdPath
    ? other.parentIdPath.concat(id)
    : extra.parentId
    ? [extra.parentId, id]
    : [id];
  const createdAt = getTimestamp();
  const folder: Folder = {
    name,
    createdAt,
    namepath,
    idPath,
    description: faker.lorem.paragraph(),
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
    resourceId: id,
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
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
  count = 20,
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null},
  other: Parameters<typeof generateTestFolder>[1] = {}
) {
  const folderModel = container.resolve<SemanticFolderProvider>(
    kInjectionKeys.semantic.folder
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );

  const items = generateTestFolders(count, extra, other);
  await semanticUtils.withTxn(async opts => folderModel.insertItem(items, opts));
  return items;
}
