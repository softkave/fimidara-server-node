import {compact, isNumber} from 'lodash-es';
import {FilePersistenceUploadPartResult} from '../../../contexts/file/types.js';
import {kIkxUtils} from '../../../contexts/ijx/injectables.js';
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
    } = await kIkxUtils.dset().scan(params.multipartId, {
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

  const partsOrNil = await kIkxUtils.cache().getJsonList<FilePartMeta>(keys);

  const parts = compact(partsOrNil);
  return {parts, continuationToken: done ? null : cursor, isDone: done};
}

export async function getMultipartUploadPartMeta(params: {
  multipartId: string;
  part: number;
}): Promise<FilePartMeta | null> {
  const key = kFileConstants.getPartCacheKey(params.multipartId, params.part);
  const part = await kIkxUtils.cache().getJson<FilePartMeta>(key);

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
    kIkxUtils.dset().add(params.multipartId, partNums),
    kIkxUtils.cache().setJsonList(kvPairs),
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
      kIkxUtils.cache().delete(key),
      kIkxUtils.dset().delete(multipartId, part.toString()),
    ]);
  } else {
    let cursor = 0;
    let iteration = 0;

    while (iteration < kFileConstants.maxPartLength) {
      const {
        values,
        done,
        cursor: nextCursor,
      } = await kIkxUtils.dset().scan(multipartId, {cursor});

      await kIkxUtils
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

    await kIkxUtils.dset().delete(multipartId);
  }
}
