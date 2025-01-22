import {compact, isNumber} from 'lodash-es';
import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {PaginationQuery} from '../../types.js';
import {kFileConstants} from '../constants.js';

export interface FilePartMeta extends FilePersistenceUploadPartResult {
  size: number;
}

export async function getMultipartUploadPartMetas(
  params: {multipartId: string; cursor?: number | null} & Pick<
    PaginationQuery,
    'pageSize'
  >
) {
  const {pageSize} = params;
  let cursor = params.cursor ?? undefined;
  let iteration = 0;
  let partNums: string[] = [];
  let done = false;

  while (iteration < kFileConstants.maxPartLength) {
    const remainingSize = pageSize ? pageSize - partNums.length : undefined;
    const {
      values,
      cursor: nextCursor,
      done: isDone,
    } = await kUtilsInjectables.dset().scan(params.multipartId, {
      cursor,
      size: remainingSize,
    });
    partNums = partNums.concat(values as string[]);

    cursor = nextCursor;
    iteration++;
    done = isDone;

    if (
      isDone ||
      partNums.length >= (pageSize ?? kFileConstants.maxPartLength)
    ) {
      break;
    }
  }

  const keys = partNums.map(partNum =>
    kFileConstants.getPartCacheKey(params.multipartId, Number(partNum))
  );

  const partsOrNil = await kUtilsInjectables
    .cache()
    .getJsonList<FilePartMeta>(keys);

  const parts = compact(partsOrNil);
  return {parts, continuationToken: done ? null : cursor, isDone: done};
}

export async function getMultipartUploadPartMeta(params: {
  multipartId: string;
  part: number;
}): Promise<FilePartMeta | null> {
  const key = kFileConstants.getPartCacheKey(params.multipartId, params.part);
  const part = await kUtilsInjectables.cache().getJson<FilePartMeta>(key);

  return part;
}

export async function writeMultipartUploadPartMetas(params: {
  multipartId: string;
  parts: FilePartMeta[];
}): Promise<FilePartMeta[]> {
  const partNums: string[] = [];
  const kvPairs: Array<{key: string; value: FilePartMeta}> = [];
  params.parts.forEach(part => {
    partNums.push(part.part.toString());
    kvPairs.push({
      key: kFileConstants.getPartCacheKey(params.multipartId, part.part),
      value: part,
    });
  });

  await Promise.all([
    kUtilsInjectables.dset().add(params.multipartId, partNums),
    kUtilsInjectables.cache().setJsonList(kvPairs),
  ]);

  return params.parts;
}

export async function deleteMultipartUploadPartMetas(params: {
  multipartId: string;
  part?: number;
}): Promise<void> {
  const {part, multipartId} = params;

  if (isNumber(part)) {
    const key = kFileConstants.getPartCacheKey(multipartId, part);
    await Promise.all([
      kUtilsInjectables.cache().delete(key),
      kUtilsInjectables.dset().delete(multipartId, part.toString()),
    ]);
  } else {
    let cursor = 0;
    let iteration = 0;

    while (iteration < kFileConstants.maxPartLength) {
      const {
        values,
        done,
        cursor: nextCursor,
      } = await kUtilsInjectables.dset().scan(multipartId, {cursor});

      await kUtilsInjectables
        .cache()
        .delete(
          values.map(v =>
            kFileConstants.getPartCacheKey(multipartId, Number(v))
          )
        );

      if (done) {
        break;
      }

      cursor = nextCursor;
      iteration++;
    }

    await kUtilsInjectables.dset().delete(multipartId);
  }
}
