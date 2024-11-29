import {compact, isNumber} from 'lodash-es';
import {loopAndCollate} from 'softkave-js-utils';
import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {PaginationQuery} from '../../types.js';
import {kFileConstants} from '../constants.js';

export async function getPartMetas(
  params: {multipartId: string; partLength: number; fromPart?: number} & Pick<
    PaginationQuery,
    'pageSize'
  >
): Promise<FilePersistenceUploadPartResult[]> {
  const {pageSize} = params;
  let parts: FilePersistenceUploadPartResult[] = [];
  const keysLength = isNumber(pageSize)
    ? Math.min(pageSize, params.partLength)
    : params.partLength;
  let fromPart = params.fromPart ?? 0;

  while (fromPart < params.partLength && parts.length < keysLength) {
    const keys = loopAndCollate(
      index =>
        kFileConstants.getPartCacheKey(params.multipartId, index + fromPart),
      keysLength
    );

    const partsOrNil = await kUtilsInjectables
      .cache()
      .getJsonList<FilePersistenceUploadPartResult>(keys);
    const partsNonNil = compact(partsOrNil);
    parts = parts.concat(partsNonNil);
    fromPart += partsNonNil.length;
  }

  return isNumber(pageSize) && parts.length > pageSize
    ? parts.slice(0, pageSize)
    : parts;
}

export async function getPartMeta(params: {
  multipartId: string;
  part: number;
}): Promise<FilePersistenceUploadPartResult | null> {
  const key = kFileConstants.getPartCacheKey(params.multipartId, params.part);
  const part = await kUtilsInjectables
    .cache()
    .getJson<FilePersistenceUploadPartResult>(key);

  return part;
}

export async function hasPartMeta(params: {multipartId: string; part: number}) {
  const part = await getPartMeta(params);
  const hasPart = !!part;

  return {hasPart, part};
}

export async function writePartMetas(params: {
  multipartId: string;
  parts: FilePersistenceUploadPartResult[];
}): Promise<FilePersistenceUploadPartResult[]> {
  await kUtilsInjectables.cache().setJsonList(
    params.parts.map(part => ({
      key: kFileConstants.getPartCacheKey(params.multipartId, part.part),
      value: part,
    }))
  );

  return params.parts;
}

export async function deletePartMetas(params: {
  multipartId: string;
  partLength: number;
}): Promise<void> {
  const {partLength} = params;
  const keys = loopAndCollate(
    part => kFileConstants.getPartCacheKey(params.multipartId, part),
    partLength
  );

  await kUtilsInjectables.cache().delete(keys);
}
