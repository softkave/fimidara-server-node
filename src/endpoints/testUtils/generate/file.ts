import {faker} from '@faker-js/faker';
import {isBoolean, isEqual, isString, isUndefined} from 'lodash';
import {File} from '../../../definitions/file';
import {PresignedPath} from '../../../definitions/presignedPath';
import {kFimidaraResourceType} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {getTimestamp} from '../../../utils/dateFns';
import {getRandomIntInclusive, pathJoin} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {getFilenameInfo} from '../../files/utils';
import {addRootnameToPath} from '../../folders/utils';
import {generateTestFolderName, generateTestFolderpath} from './folder';
import {randomActionList} from './utils';

function addExtenstion(name: string, ext: string | undefined) {
  return ext ? name + '.' + ext : name;
}

export const kTestFileNameSeparatorChars = ['-', '_', ' '];

export function generateTestFileName(
  props: {
    separatorChars?: string[];
    includeStraySlashes?: boolean;
    extension?: string | boolean;
    rootname?: string;
  } = {}
) {
  const {
    extension,
    includeStraySlashes = false,
    separatorChars = kTestFileNameSeparatorChars,
  } = props;
  let filename = '';

  if (
    isUndefined(extension) &&
    isUndefined(includeStraySlashes) &&
    isUndefined(separatorChars)
  ) {
    const extCount = getRandomIntInclusive(0, 5);
    filename = faker.system.fileName({extensionCount: extCount});
  } else if (isEqual(extension, false)) {
    filename = generateTestFolderName(props);
  } else {
    const name = generateTestFolderName(props);
    filename = addExtenstion(
      name,
      isBoolean(extension)
        ? extension === true
          ? faker.system.fileExt()
          : isString(extension)
          ? extension
          : undefined
        : undefined
    );
  }

  if (props.rootname) {
    filename = addRootnameToPath(filename, props.rootname);
  }

  return filename;
}

export function generateTestFilepath(
  props: Parameters<typeof generateTestFileName>[0] &
    Parameters<typeof generateTestFolderpath>[0] & {length?: number} = {}
) {
  const {length = 3} = props;
  let filepath = generateTestFolderpath({
    ...props,
    length: length - 1,
    rootname: undefined,
  }).concat(
    length - (length - 1) > 0 ? generateTestFileName({...props, rootname: undefined}) : []
  );

  if (props.rootname) {
    filepath = addRootnameToPath(filepath, props.rootname);
  }

  return filepath;
}

export function generateTestFilepathString(
  props: Parameters<typeof generateTestFileName>[0] &
    Parameters<typeof generateTestFolderpath>[0] & {length?: number} = {}
): string {
  return pathJoin(generateTestFilepath(props));
}

export function generateTestFile(extra: Partial<File> & {parentId?: string | null} = {}) {
  const {parentId = null} = extra;
  const id = getNewIdForResource(kFimidaraResourceType.File);
  const name = generateTestFileName();
  const nameinfo = getFilenameInfo(name);
  const createdAt = getTimestamp();
  const file: File = {
    name,
    createdAt,
    parentId,
    description: faker.lorem.paragraph(),
    mimetype: faker.system.mimeType(),
    createdBy: kSystemSessionAgent,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: kSystemSessionAgent,
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
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    extension: nameinfo.extension,
    version: 1,
    isReadAvailable: true,
    isWriteAvailable: true,
    isDeleted: false,
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
  count = 20,
  extra: Partial<File> & {parentId: string | null} = {parentId: null}
) {
  const items = generateTestFiles(count, extra);
  await kSemanticModels
    .utils()
    .withTxn(
      async opts => kSemanticModels.file().insertItem(items, opts),
      /** reuseTxn */ true
    );
  return items;
}

export function generateTestPresignedPath(extra: Partial<PresignedPath> = {}) {
  const id = getNewIdForResource(kFimidaraResourceType.PresignedPath);
  const createdAt = getTimestamp();
  const data: PresignedPath = {
    namepath: generateTestFilepath(),
    fileId: getNewIdForResource(kFimidaraResourceType.File),
    extension: faker.system.fileExt(),
    issuerAgentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
    maxUsageCount: faker.number.int({min: 0}),
    spentUsageCount: faker.number.int({min: 0}),
    expiresAt: getTimestamp(),
    actions: randomActionList(),
    createdAt,
    createdBy: kSystemSessionAgent,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: kSystemSessionAgent,
    resourceId: id,
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    isDeleted: false,
    ...extra,
  };

  return data;
}

export function generateTestPresignedPathList(
  count = 20,
  extra: Partial<PresignedPath> = {}
) {
  const itemList: PresignedPath[] = [];
  for (let i = 0; i < count; i++) {
    itemList.push(generateTestPresignedPath(extra));
  }
  return itemList;
}

export async function generateAndInsertTestPresignedPathList(
  count = 20,
  extra: Partial<PresignedPath> = {}
) {
  const items = generateTestPresignedPathList(count, extra);
  await kSemanticModels
    .utils()
    .withTxn(
      async opts => kSemanticModels.presignedPath().insertItem(items, opts),
      /** reuseTxn */ true
    );
  return items;
}
