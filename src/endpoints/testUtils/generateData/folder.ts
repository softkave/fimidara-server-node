import {faker} from '@faker-js/faker';
import {IFolder} from '../../../definitions/folder';
import {AppResourceType, SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getRandomIntInclusive} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

export function generateTestFolderName() {
  return getRandomIntInclusive(1, 2) % 2 === 0
    ? faker.system.commonFileName()
    : faker.lorem.words();
}

export function generateTestFolder(
  extra: Partial<IFolder> & {parentId: string | null} = {parentId: null}
) {
  const id = getNewIdForResource(AppResourceType.Folder);
  const name = faker.lorem.words();
  const createdAt = getTimestamp();
  const folder: IFolder = {
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
  extra: Partial<IFolder> & {parentId: string | null} = {parentId: null}
) {
  const folders: IFolder[] = [];
  for (let i = 0; i < count; i++) {
    folders.push(generateTestFolder(extra));
  }
  return folders;
}

export async function generateAndInsertTestFolders(
  ctx: IBaseContext,
  count = 20,
  extra: Partial<IFolder> & {parentId: string | null} = {parentId: null}
) {
  const items = generateTestFolders(count, extra);
  await executeWithMutationRunOptions(ctx, async opts =>
    ctx.semantic.folder.insertItem(items, opts)
  );
  return items;
}
