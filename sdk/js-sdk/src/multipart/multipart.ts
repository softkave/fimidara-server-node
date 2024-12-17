import assert from 'assert';
import {isNumber} from 'lodash-es';
import {
  kLoopAsyncSettlementType,
  loopAsync,
  OrPromise,
} from 'softkave-js-utils';
import type {FimidaraEndpoints} from '../endpoints/publicEndpoints.js';
import type {
  PartDetails,
  UploadFileEndpointParams,
} from '../endpoints/publicTypes.js';
import {FimidaraEndpointError} from '../error.js';

const kMaxFileSize = 50 * 1024 * 1024 * 1024; // 50GB
const kMaxParts = 10_000;
const kMinPartSize = 10 * 1024 * 1024; // 10MB
const kMaxInMemoryBufferSize = 50 * 1024 * 1024; // 50MB

function determineMultipartParams(
  size: number,
  inputNumConcurrentParts?: number
): {
  numStreams: number;
  numParts: number;
  partSize: number;
} {
  const numParts = Math.min(kMaxParts, Math.ceil(size / kMinPartSize));
  const partSize = Math.ceil(size / numParts);
  const numStreams =
    inputNumConcurrentParts ??
    (partSize > kMaxInMemoryBufferSize
      ? 1
      : Math.ceil(size / kMaxInMemoryBufferSize));
  return {numStreams, numParts, partSize};
}

async function getUploadPartDetails(params: {
  fileId?: string;
  filepath?: string;
  endpoints: FimidaraEndpoints;
}) {
  try {
    let continuationToken: string | undefined;
    let details: PartDetails[] = [];
    let clientMultipartId: string | undefined;

    while (true) {
      const result = await params.endpoints.files.getPartDetails({
        continuationToken,
        fileId: params.fileId,
        filepath: params.filepath,
      });

      details.push(...result.details);
      continuationToken = result.continuationToken;
      clientMultipartId = result.clientMultipartId;

      if (!continuationToken || result.isDone || !result.clientMultipartId) {
        break;
      }
    }

    return {details, clientMultipartId};
  } catch (error: unknown) {
    if (error instanceof FimidaraEndpointError && error.statusCode === 404) {
      return {details: [], clientMultipartId: undefined};
    }

    throw error;
  }
}

export interface IMultipartUploadHookFnParams {
  part: number;
  size: number;
  estimatedNumParts: number;
}

export interface IMultipartUploadParams
  extends Pick<
    UploadFileEndpointParams,
    'description' | 'encoding' | 'mimetype' | 'fileId' | 'filepath'
  > {
  endpoints: FimidaraEndpoints;
  clientMultipartId: string;
  size: number;
  readFrom: (
    start: number,
    end: number,
    size: number
  ) => Promise<{data: UploadFileEndpointParams['data']; size: number}>;
  beforePart?: (params: IMultipartUploadHookFnParams) => OrPromise<void>;
  afterPart?: (params: IMultipartUploadHookFnParams) => OrPromise<void>;
  numConcurrentParts?: number;
}

async function uploadOnce(params: IMultipartUploadParams) {
  const {
    size,
    readFrom,
    endpoints,
    beforePart,
    afterPart,
    numConcurrentParts,
    ...rest
  } = params;

  const {data, size: partSize} = await readFrom(0, size, size);
  const hookParams: IMultipartUploadHookFnParams = {
    part: 0,
    size: partSize,
    estimatedNumParts: 1,
  };

  await beforePart?.(hookParams);
  const result = await endpoints.files.uploadFile({
    data,
    description: rest.description,
    encoding: rest.encoding,
    mimetype: rest.mimetype,
    fileId: rest.fileId,
    filepath: rest.filepath,
    size: partSize,
  });
  await afterPart?.(hookParams);
  return result;
}

export async function multipartUpload(params: IMultipartUploadParams) {
  const {
    size,
    readFrom,
    endpoints,
    beforePart,
    afterPart,
    numConcurrentParts,
    ...rest
  } = params;

  if (size > kMaxFileSize) {
    throw new Error(
      `File size exceeds maximum allowed size of ${kMaxFileSize} bytes`
    );
  }

  if (size < kMinPartSize) {
    return uploadOnce(params);
  }

  const {numStreams, numParts, partSize} = determineMultipartParams(
    size,
    numConcurrentParts
  );

  const runOrder = Array.from({length: numParts}, (_, i) => i);
  const ranSet = new Set<number>();

  const {details, clientMultipartId: existingClientMultipartId} =
    await getUploadPartDetails({
      fileId: rest.fileId,
      filepath: rest.filepath,
      endpoints,
    });

  if (existingClientMultipartId) {
    assert.equal(
      existingClientMultipartId,
      params.clientMultipartId,
      'There is an existing multipart upload with a different clientMultipartId'
    );
  }

  const clientMultipartId =
    existingClientMultipartId ?? params.clientMultipartId;

  details.forEach(part => {
    ranSet.add(part.part);
  });

  const getNextPart = () => {
    return runOrder.find(part => !ranSet.has(part));
  };

  async function readNext(params: {part?: number; forceRun?: boolean} = {}) {
    const part = params?.part ?? getNextPart();

    if (
      !isNumber(part) ||
      part >= numParts ||
      (ranSet.has(part) && !params?.forceRun)
    ) {
      return null;
    }

    // updating the set here and not in getNextPart is fine for now because
    // there's no async code between getting a part and adding it to the set.
    // also, because the caller can pass a part number, someone needs to add to
    // the set.
    // TODO: also, should uploading a part fail, we'd need to remove the part from
    // the set so that we don't skip a part on retry.
    ranSet.add(part);

    // const partBlob = file.slice(part * partSize, (part + 1) * partSize);
    const partData = await readFrom(
      part * partSize,
      (part + 1) * partSize,
      partSize
    );
    return {partData, part};
  }

  await loopAsync(
    async () => {
      let dataOrNull = await readNext();

      while (dataOrNull && dataOrNull.partData.size) {
        const hookParams: IMultipartUploadHookFnParams = {
          part: dataOrNull.part,
          size: dataOrNull.partData.size,
          estimatedNumParts: numParts,
        };

        await beforePart?.(hookParams);
        await endpoints.files.uploadFile({
          ...rest,
          clientMultipartId,
          size: dataOrNull.partData.size,
          part: dataOrNull.part,
          data: dataOrNull.partData.data,
        });
        await afterPart?.(hookParams);
        dataOrNull = await readNext();
      }
    },
    numStreams,
    kLoopAsyncSettlementType.all
  );

  const result = await endpoints.files.uploadFile({
    ...rest,
    clientMultipartId,
    size: 0,
    data: '', // empty blob to signify end of multipart upload
    part: -1,
    isLastPart: true,
  });

  return result;
}
