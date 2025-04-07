import {faker} from '@faker-js/faker';
import {
  getRandomIntInclusive,
  loopAndCollate,
  pathJoin,
} from 'softkave-js-utils';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {
  getNewIdForResource,
  newWorkspaceResource,
} from '../../../utils/resource.js';
import {addRootnameToPath} from '../../folders/utils.js';

export const kTestFolderNameSeparatorChars = ['-', '_', ' ', '.'];

export function generateTestFolderName(
  props: {
    separatorChars?: string[];
    includeStraySeparators?: boolean;
    rootname?: string;
  } = {}
) {
  const {
    separatorChars = kTestFolderNameSeparatorChars,
    includeStraySeparators = false,
  } = props;
  const wordCount = getRandomIntInclusive(3, 10);
  const seed = getRandomIntInclusive(1, 2);
  const separator = faker.helpers.arrayElement(
    separatorChars ?? kTestFolderNameSeparatorChars
  );

  let name = faker.lorem
    .words(wordCount)
    .split(' ')
    .map(word =>
      /** introduce a little randomness in the name, mixing uppercase and
       * lowercase characters to test that names are matched case-insensitively. */
      seed === 1 ? word : word.toUpperCase()
    )
    .join(separator);

  // Randomly inlcude stray separators to test that empty names are handled
  // appropriately
  name = includeStraySeparators
    ? new Array(getRandomIntInclusive(1, 3)).fill('/').join('') + name
    : name;

  if (props.rootname) {
    name = addRootnameToPath(name, props.rootname);
  }

  return name;
}

export function generateTestFolderpath(
  props: Parameters<typeof generateTestFolderName>[0] & {
    length?: number;
    parentNamepath?: string[];
  } = {}
) {
  const {parentNamepath = [], length = 3} = props;
  let folderpath = loopAndCollate(
    index => {
      const name = generateTestFolderName({...props, rootname: undefined});
      return index < length + 1 ? parentNamepath[index] || name : name;
    },
    /** count */ Math.max(length, 0)
  );

  if (props.rootname) {
    folderpath = addRootnameToPath(folderpath, props.rootname);
  }

  return folderpath;
}

export function generateTestFolderpathString(
  props: Parameters<typeof generateTestFolderpath>[0] = {}
): string {
  return pathJoin({input: generateTestFolderpath(props)});
}

export async function generateUniqueFolderpath(workspaceId: string) {
  let length = 3;
  const max = 10;

  while (length < max) {
    const folderpath = generateTestFolderpath({length});
    const folder = await kIjxSemantic.folder().getOneByNamepath({
      workspaceId,
      namepath: folderpath,
    });

    if (!folder) {
      return folderpath;
    }

    length += 1;
  }

  throw new Error('Could not generate unique folderpath');
}

export function generateTestFolder(
  extra: Partial<Folder> & {parentId: string | null} = {parentId: null},
  other: {parentNamepath?: string[]; parentIdPath?: string[]} = {}
) {
  const resourceId = getNewIdForResource(kFimidaraResourceType.Folder);
  const name = generateTestFolderName();
  const namepath = other.parentNamepath
    ? other.parentNamepath.concat(name)
    : [name];
  const idPath = other.parentIdPath
    ? other.parentIdPath.concat(resourceId)
    : extra.parentId
      ? [extra.parentId, resourceId]
      : [resourceId];
  const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
  const folder: Folder = newWorkspaceResource<Folder>(
    kSystemSessionAgent,
    kFimidaraResourceType.Folder,
    workspaceId,
    /** seed */ {
      name,
      namepath,
      idPath,
      resourceId,
      description: faker.lorem.paragraph(),
      ...extra,
    }
  );
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
  const folderModel = kIjxSemantic.folder();
  const semanticUtils = kIjxSemantic.utils();
  const items = generateTestFolders(count, extra, other);
  await semanticUtils.withTxn(async opts =>
    folderModel.insertItem(items, opts)
  );
  return items;
}
