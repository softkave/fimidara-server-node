import assert from 'assert';
import {isNumber} from 'lodash-es';
import {
  kLoopAsyncSettlementType,
  loopAsync,
  OrPromise,
  waitTimeout,
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

async function listUploadedParts(params: {
  fileId?: string;
  filepath?: string;
  endpoints: FimidaraEndpoints;
}) {
  try {
    let page: number | undefined;
    let parts: PartDetails[] = [];
    let clientMultipartId: string | undefined;

    while (true) {
      const result = await params.endpoints.files.listParts({
        page,
        fileId: params.fileId,
        filepath: params.filepath,
      });

      parts.push(...result.parts);
      page = result.page + 1;
      clientMultipartId = result.clientMultipartId;

      if (result.parts.length === 0) {
        break;
      }
    }

    return {parts, clientMultipartId};
  } catch (error: unknown) {
    if (error instanceof FimidaraEndpointError && error.statusCode === 404) {
      return {parts: [], clientMultipartId: undefined};
    }

    throw error;
  }
}

export interface IMultipartUploadHookFnParams {
  part: number;
  size: number;
  estimatedNumParts: number;
  percentComplete: number;
  sizeCompleted: number;
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
   * If `true`, upload will be resumed from the last part uploaded. If `false`,
   * upload will start afresh. Default is `true`.
   */
  resume?: boolean;
  /**
   * If `true`, part events will be fired for resumed parts. Default is `true`.
   */
  firePartEventsForResumedParts?: boolean;
  /**
   * The maximum number of times to retry failed parts. This threshold is shared
   * across all parts, although if a part fails more than 3 times, it will be
   * marked failed and the upload will fail as a whole. Default is `10`, max is
   * `50`.
   */
  maxRetryCount?: number;
  /**
   * If `true`, the upload will wait for the complete upload job to finish.
   * Default is `true`.
   */
  shouldWaitForCompleteUploadJob?: boolean;
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
    part: 1,
    size: partSize,
    estimatedNumParts: 1,
    percentComplete: 0,
    sizeCompleted: 0,
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
    sizeCompleted: partSize,
  };

  await fireAfterPart(afterPartHookParams);
  return result;
}

async function waitForCompleteUploadJob(params: {
  jobId: string;
  endpoints: FimidaraEndpoints;
  fileId?: string;
  filepath?: string;
}) {
  const result = await params.endpoints.jobs.getJobStatus({
    jobId: params.jobId,
  });

  if (result.status === 'completed') {
    const {file} = await params.endpoints.files.getFileDetails({
      fileId: params.fileId,
      filepath: params.filepath,
    });

    return file;
  } else if (result.status === 'failed') {
    throw new Error(result.errorMessage);
  }

  await waitTimeout(1_000);
  return waitForCompleteUploadJob(params);
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
    shouldWaitForCompleteUploadJob = true,
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

  const runningParts = new Set<number>();
  const completedParts = new Set<number>();
  let retryCount = 0;

  const {parts: resumedParts, clientMultipartId: existingClientMultipartId} =
    resume
      ? await listUploadedParts({
          fileId: rest.fileId,
          filepath: rest.filepath,
          endpoints,
        })
      : {parts: [], clientMultipartId: undefined};

  if (existingClientMultipartId) {
    assert.equal(
      existingClientMultipartId,
      params.clientMultipartId,
      'There is an existing multipart upload with a different clientMultipartId'
    );
  } else {
    await endpoints.files.startMultipartUpload({
      clientMultipartId: params.clientMultipartId,
      fileId: rest.fileId,
      filepath: rest.filepath,
    });
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
      completedParts.add(part.part);
      sizeComplete += part.size;
      const percentComplete = (completedParts.size / numParts) * 100;
      if (firePartEventsForResumedParts) {
        await fireAfterPart({
          part: part.part,
          size: part.size,
          estimatedNumParts: numParts,
          percentComplete,
          sizeCompleted: sizeComplete,
        });
      }
    })
  );

  const getNextPart = () => {
    // TODO: this can be optimized
    for (let i = 1; i <= numParts; i++) {
      const isRunning = runningParts.has(i);
      const isCompleted = completedParts.has(i);
      if (!isRunning && !isCompleted) {
        return i;
      }
    }

    return undefined;
  };

  async function readNext(params: {part?: number; forceRun?: boolean} = {}) {
    const part = params?.part ?? getNextPart();
    const isRunning = part && runningParts.has(part);
    const isCompleted = part && completedParts.has(part);

    if (
      !isNumber(part) ||
      part > numParts ||
      ((isRunning || isCompleted) && !params?.forceRun)
    ) {
      return null;
    }

    runningParts.add(part);
    // -1 because underlying data is 0-indexed
    const start = (part - 1) * partSize;
    const end = start + partSize;
    const partData = await readFrom(start, end, partSize);
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
        percentComplete: ((completedParts.size - 1) / numParts) * 100,
        sizeCompleted: sizeComplete,
      };

      await fireBeforePart(
        beforePartHookParams,
        /** preventFire */ partRetryCount > 0
      );

      await endpoints.files.uploadFile({
        clientMultipartId,
        size: data.partData.size,
        part: data.part,
        data: data.partData.data,
        description: rest.description,
        encoding: rest.encoding,
        mimetype: rest.mimetype,
        fileId: rest.fileId,
        filepath: rest.filepath,
      });

      completedParts.add(data.part);
      runningParts.delete(data.part);
      sizeComplete += data.partData.size;
      const afterPartHookParams: IMultipartUploadHookFnParams = {
        ...beforePartHookParams,
        percentComplete: (completedParts.size / numParts) * 100,
        sizeCompleted: sizeComplete,
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

  const result = await endpoints.files.completeMultipartUpload({
    fileId: rest.fileId,
    filepath: rest.filepath,
    clientMultipartId,
    parts: Array.from(completedParts).map(part => ({
      part,
    })),
  });

  if (shouldWaitForCompleteUploadJob && result.jobId) {
    const file = await waitForCompleteUploadJob({
      jobId: result.jobId,
      endpoints,
      fileId: rest.fileId,
      filepath: rest.filepath,
    });

    return {...result, file};
  }

  return result;
}
