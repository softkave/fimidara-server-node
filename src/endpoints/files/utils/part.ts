import {flatten, isNumber} from 'lodash-es';
import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {InvalidStateError, NotFoundError} from '../../errors.js';
import {kFileConstants} from '../constants.js';

async function getFile(params: {fileId: string}) {
  const file = await kSemanticModels.file().getOneById(params.fileId);
  appAssert(file, new NotFoundError('File not found'));
  appAssert(
    isNumber(file.partLength),
    new InvalidStateError("File doesn't have any ongoing multipart upload")
  );

  return {file, partLength: file.partLength};
}

export async function getParts(params: {
  fileId: string;
}): Promise<FilePersistenceUploadPartResult[]> {
  const {partLength} = await getFile(params);
  const keys = kFileConstants.getPossiblePartResultListCacheKeys(
    params.fileId,
    partLength
  );
  const partResultsList = await Promise.all(
    keys.map(async key => {
      const result = await kUtilsInjectables
        .cache()
        .get<FilePersistenceUploadPartResult[]>(key);
      return result || [];
    })
  );

  return flatten(partResultsList);
}

export async function getPartResult(params: {
  fileId: string;
  part: number;
}): Promise<FilePersistenceUploadPartResult[] | null> {
  const {partLength} = await getFile(params);
  const key = kFileConstants.getPartResultListCacheKey(
    params.fileId,
    params.part,
    partLength
  );
  const partResults = await kUtilsInjectables
    .cache()
    .get<FilePersistenceUploadPartResult[]>(key);

  return partResults;
}

export async function hasPartResult(params: {fileId: string; part: number}) {
  const partResults = await getPartResult(params);
  const part = partResults?.find(part => part.part === params.part);
  const hasPart = !!part;

  return {hasPart, part};
}

export async function writeParts(
  params: {fileId: string} & Pick<FilePersistenceUploadPartResult, 'part'>
): Promise<void> {
  const {partLength} = await getFile(params);
  const key = kFileConstants.getPartResultListCacheKey(
    params.fileId,
    params.part,
    partLength
  );
  const partResults = await kUtilsInjectables
    .cache()
    .get<FilePersistenceUploadPartResult[]>(key);

  if (!partResults) {
    await kUtilsInjectables.cache().set(key, [params]);
  } else {
    await kUtilsInjectables.cache().set(key, [...partResults, params]);
  }
}

export async function deleteParts(params: {fileId: string}): Promise<void> {
  const {partLength} = await getFile(params);
  const keys = kFileConstants.getPossiblePartResultListCacheKeys(
    params.fileId,
    partLength
  );

  await Promise.all(keys.map(key => kUtilsInjectables.cache().delete(key)));
}
