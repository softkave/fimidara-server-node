import {faker} from '@faker-js/faker';
import {IFolder} from '../../../definitions/folder';
import {AppResourceType, SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {getDate} from '../../../utils/dateFns';
import {getRandomIntInclusive} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateTestFolderName() {
  return getRandomIntInclusive(1, 2) % 2 === 0
    ? faker.system.commonFileName()
    : faker.lorem.words();
}

export function generateTestFolder(extra: Partial<IFolder> = {}) {
  const id = getNewIdForResource(AppResourceType.Folder);
  const name = faker.lorem.words();
  const createdAt = getDate();
  const folder: IFolder = {
    name,
    createdAt,
    description: faker.lorem.paragraph(),
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: faker.date.future(),
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
    idPath: [id],
    namePath: [name],
    resourceId: id,
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    ...extra,
  };

  return folder;
}

export function generateTestFolders(count = 20, extra: Partial<IFolder> = {}) {
  const folders: IFolder[] = [];
  for (let i = 0; i < count; i++) {
    folders.push(generateTestFolder(extra));
  }
  return folders;
}

export async function generateAndInsertTestFolders(
  ctx: IBaseContext,
  count = 20,
  extra: Partial<IFolder> = {}
) {
  const items = generateTestFolders(count, extra);
  await ctx.semantic.folder.insertList(items);
  return items;
}