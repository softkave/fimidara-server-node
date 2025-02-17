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
const kMaxRetryCount = 50;
const kDefaultRetryCount = 10;
const kMaxRetryCountForFailedParts = 3;
const kLastPartId = -1;
const kLastPartSize = 0;
const kLastPartData = ''; // empty blob to signify end of multipart upload

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
  percentComplete: number;
  sizeComplete: number;
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
  /**
   * If `true`, upload will be resumed from the last part that was uploaded. If
   * `false`, upload will be started from the beginning. Default is `true`.
   */
  resume?: boolean;
  /**
   * If `true`, part events will be fired for resumed parts. Default is `true`.
   */
  firePartEventsForResumedParts?: boolean;
  /**
   * The maximum number of times to retry an upload part. Default is `10`. Max
   * is `50`. If a part fails more than 3 times, it will be marked as failed and
   * the upload will fail.
   */
  maxRetryCount?: number;
}

export interface IMultipartUploadParamsWithTestInstrumentation {
  __beforePart?: (params: IMultipartUploadHookFnParams) => OrPromise<void>;
  __afterPart?: (params: IMultipartUploadHookFnParams) => OrPromise<void>;
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

  async function fireBeforePart(params: IMultipartUploadHookFnParams) {
    await beforePart?.(params);
    await (
      params as unknown as IMultipartUploadParamsWithTestInstrumentation
    ).__beforePart?.(params);
  }

  async function fireAfterPart(params: IMultipartUploadHookFnParams) {
    await afterPart?.(params);
    await (
      params as unknown as IMultipartUploadParamsWithTestInstrumentation
    ).__afterPart?.(params);
  }

  const {data, size: partSize} = await readFrom(0, size, size);
  const beforePartHookParams: IMultipartUploadHookFnParams = {
    part: 0,
    size: partSize,
    estimatedNumParts: 1,
    percentComplete: 0,
    sizeComplete: 0,
  };

  await fireBeforePart(beforePartHookParams);
  const result = await endpoints.files.uploadFile({
    data,
    description: rest.description,
    encoding: rest.encoding,
    mimetype: rest.mimetype,
    fileId: rest.fileId,
    filepath: rest.filepath,
    size: partSize,
  });

  const afterPartHookParams: IMultipartUploadHookFnParams = {
    ...beforePartHookParams,
    percentComplete: 100,
    sizeComplete: partSize,
  };

  await fireAfterPart(afterPartHookParams);
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
    resume = true,
    firePartEventsForResumedParts = true,
    maxRetryCount: inputMaxRetryCount,
    ...rest
  } = params;

  let maxRetryCount = inputMaxRetryCount ?? kDefaultRetryCount;
  maxRetryCount = Math.min(maxRetryCount, kMaxRetryCount);

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

  const ranSet = new Set<number>();
  let retryCount = 0;

  const {details: resumedParts, clientMultipartId: existingClientMultipartId} =
    resume
      ? await getUploadPartDetails({
          fileId: rest.fileId,
          filepath: rest.filepath,
          endpoints,
        })
      : {details: [], clientMultipartId: undefined};

  if (existingClientMultipartId) {
    assert.equal(
      existingClientMultipartId,
      params.clientMultipartId,
      'There is an existing multipart upload with a different clientMultipartId'
    );
  }

  const clientMultipartId =
    existingClientMultipartId ?? params.clientMultipartId;
  let sizeComplete = 0;

  async function fireBeforePart(
    params: IMultipartUploadHookFnParams,
    preventFire = false
  ) {
    if (!preventFire) {
      await beforePart?.(params);
    }

    await (
      rest as unknown as IMultipartUploadParamsWithTestInstrumentation
    ).__beforePart?.(params);
  }

  async function fireAfterPart(params: IMultipartUploadHookFnParams) {
    await afterPart?.(params);
    await (
      rest as unknown as IMultipartUploadParamsWithTestInstrumentation
    ).__afterPart?.(params);
  }

  await Promise.all(
    resumedParts.map(async part => {
      ranSet.add(part.part - 1);
      sizeComplete += part.size;
      const percentComplete = (ranSet.size / numParts) * 100;
      const partNo = part.part - 1;

      if (firePartEventsForResumedParts) {
        await fireAfterPart({
          part: partNo,
          size: part.size,
          estimatedNumParts: numParts,
          percentComplete,
          sizeComplete,
        });
      }
    })
  );

  const getNextPart = () => {
    for (let i = 0; i < numParts; i++) {
      if (!ranSet.has(i)) {
        return i;
      }
    }

    return undefined;
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

    ranSet.add(part);
    const partData = await readFrom(
      part * partSize,
      (part + 1) * partSize,
      partSize
    );

    return {partData, part};
  }

  // for some reason, upload continues to run even after loopAsync fails so we
  // need a mechanism to stop internal loops when loopAsync fails
  let isDone = false;

  async function runPart(
    data: NonNullable<Awaited<ReturnType<typeof readNext>>>,
    partRetryCount = 0
  ) {
    if (isDone) {
      return;
    }

    try {
      const beforePartHookParams: IMultipartUploadHookFnParams = {
        part: data.part,
        size: data.partData.size,
        estimatedNumParts: numParts,
        // -1 because we're not counting the current part
        percentComplete: ((ranSet.size - 1) / numParts) * 100,
        sizeComplete,
      };

      await fireBeforePart(
        beforePartHookParams,
        /** preventFire */ partRetryCount > 0
      );

      await endpoints.files.uploadFile({
        clientMultipartId,
        size: data.partData.size,
        part: data.part + 1,
        data: data.partData.data,
        description: rest.description,
        encoding: rest.encoding,
        mimetype: rest.mimetype,
        fileId: rest.fileId,
        filepath: rest.filepath,
      });

      sizeComplete += data.partData.size;
      const afterPartHookParams: IMultipartUploadHookFnParams = {
        ...beforePartHookParams,
        percentComplete: (ranSet.size / numParts) * 100,
        sizeComplete,
      };

      await fireAfterPart(afterPartHookParams);
    } catch (error) {
      retryCount++;
      if (retryCount > maxRetryCount) {
        throw error;
      }

      partRetryCount++;
      if (partRetryCount > kMaxRetryCountForFailedParts) {
        throw error;
      }

      return runPart(data, partRetryCount);
    }
  }

  try {
    await loopAsync(
      async () => {
        if (isDone) {
          return;
        }

        let dataOrNull = await readNext();

        while (dataOrNull && dataOrNull.partData.size) {
          await runPart(dataOrNull);
          dataOrNull = await readNext();
        }
      },
      numStreams,
      kLoopAsyncSettlementType.all
    );
  } finally {
    isDone = true;
  }

  const result = await endpoints.files.uploadFile({
    clientMultipartId,
    size: kLastPartSize,
    data: kLastPartData,
    part: kLastPartId,
    isLastPart: true,
    description: rest.description,
    encoding: rest.encoding,
    mimetype: rest.mimetype,
    fileId: rest.fileId,
    filepath: rest.filepath,
  });

  return result;
}
