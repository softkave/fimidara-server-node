import {faker} from '@faker-js/faker';
import {File} from '../../../definitions/file';
import {AppResourceTypeMap} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getRandomIntInclusive} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';
import {getFilenameInfo} from '../../files/utils';
import {addRootnameToPath} from '../../folders/utils';
import {generateTestFolderName} from './folder';

function addExtenstion(name: string, ext: string) {
  return name + '.' + ext;
}

export const kTestFileNameSeparatorChars = ['-', '_', ' '];

export function generateTestFileName(
  props: {
    separatorChars?: string[];
    includeStraySlashes?: boolean;
    extension?: string;
    rootname?: string;
  } = {
    separatorChars: kTestFileNameSeparatorChars,
    includeStraySlashes: false,
  }
) {
  const seed = getRandomIntInclusive(1, 3);
  let filename = '';

  if (seed === 1) {
    const extCount = getRandomIntInclusive(1, 5);
    filename = faker.system.fileName({extensionCount: extCount});
  } else if (seed === 2) {
    const name = generateTestFolderName(props);
    filename = addExtenstion(name, props.extension ?? faker.system.fileExt());
  } else {
    filename = generateTestFolderName(props);
  }

  if (props.rootname) {
    filename = addRootnameToPath(filename, props.rootname);
  }

  return filename;
}

export function generateTestFile(
  extra: Partial<File> & {parentId: string | null} = {parentId: null}
) {
  const id = getNewIdForResource(AppResourceTypeMap.File);
  const name = generateTestFileName();
  const nameinfo = getFilenameInfo(name);
  const createdAt = getTimestamp();
  const file: File = {
    name,
    createdAt,
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
    idPath: extra.idPath
      ? extra.idPath.concat(id)
      : extra.parentId
      ? [extra.parentId, id]
      : [id],
    namepath: extra.namepath
      ? extra.namepath.concat(nameinfo.filenameExcludingExt)
      : [nameinfo.filenameExcludingExt],
    resourceId: id,
    size: faker.number.int({min: 1}),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    extension: nameinfo.extension,
    version: 1,
    isReadAvailable: true,
    isWriteAvailable: true,
    head: id,
    ...extra,
  };

  return file;
}

export function generateTestFiles(
  count = 20,
  extra: Partial<File> & {parentId: string | null} = {parentId: null}
) {
  const files: File[] = [];
  for (let i = 0; i < count; i++) {
    files.push(generateTestFile(extra));
  }
  return files;
}

export async function generateAndInsertTestFiles(
  ctx: BaseContextType,
  count = 20,
  extra: Partial<File> & {parentId: string | null} = {parentId: null}
) {
  const items = generateTestFiles(count, extra);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.file.insertItem(items, opts)
  );
  return items;
}
