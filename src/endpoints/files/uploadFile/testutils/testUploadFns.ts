import {faker} from '@faker-js/faker';
import assert from 'assert';
import {compact, isNumber, last, merge, omit} from 'lodash-es';
import {
  getNewId,
  kLoopAsyncSettlementType,
  noopAsync,
  OrPromise,
  pathJoin,
} from 'softkave-js-utils';
import {Readable} from 'stream';
import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../../definitions/agentToken.js';
import {kJobStatus} from '../../../../definitions/job.js';
import {Workspace} from '../../../../definitions/workspace.js';
import {addRootnameToPath} from '../../../folders/utils.js';
import {runJob} from '../../../jobs/runJob.js';
import RequestData from '../../../RequestData.js';
import {generateTestFileName} from '../../../testHelpers/generate/file.js';
import {
  generateTestFileBinary,
  GenerateTestFileType,
} from '../../../testHelpers/generate/file/generateTestFileBinary.js';
import {IGenerateImageProps} from '../../../testHelpers/generate/file/generateTestImage.js';
import {
  insertFileForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../../testHelpers/utils.js';
import completeMultipartUpload from '../../completeMultipartUpload/handler.js';
import {
  CompleteMultipartUploadEndpointParams,
  CompleteMultipartUploadEndpointResult,
} from '../../completeMultipartUpload/types.js';
import startMultipartUpload from '../../startMultipartUpload/handler.js';
import {
  StartMultipartUploadEndpointParams,
  StartMultipartUploadEndpointResult,
} from '../../startMultipartUpload/types.js';
import {UploadFileEndpointParams} from '../types.js';

type InsertFileForTestResult = Awaited<ReturnType<typeof insertFileForTest>>;
type AfterEachFn = (partResult: InsertFileForTestResult) => OrPromise<void>;

type RunAllFn = (params?: {
  shuffle?: boolean;
  afterEach?: AfterEachFn;
  settlementType?:
    | typeof kLoopAsyncSettlementType.all
    | typeof kLoopAsyncSettlementType.oneByOne;
}) => Promise<InsertFileForTestResult[]>;

type RunNextFn = (params?: {
  forceRun?: boolean;
  part?: number;
  afterEach?: AfterEachFn;
}) => Promise<InsertFileForTestResult | null>;

interface ITestUploadFnResult {
  runAll: RunAllFn;
  runNext: RunNextFn;
  dataBuffer: Buffer | undefined;
  startUpload: () => Promise<StartMultipartUploadEndpointResult | void>;
  completeUpload: (params?: {
    shouldWaitForJob?: boolean;
  }) => Promise<CompleteMultipartUploadEndpointResult | void>;
}

export const singleFileUpload = async (params: {
  userToken: AgentToken | null;
  workspace: Workspace;
  fileInput?: Partial<UploadFileEndpointParams>;
  type?: GenerateTestFileType;
  imageProps?: IGenerateImageProps;
}): Promise<ITestUploadFnResult> => {
  const {userToken, workspace, fileInput, type, imageProps} = params;
  const {dataBuffer} = await generateTestFileBinary({
    type,
    imageProps,
  });

  const runNext: RunNextFn = async runParams => {
    const {afterEach} = runParams ?? {};
    const result = await insertFileForTest(
      userToken,
      workspace,
      /** fileInput */ {
        ...omit(fileInput, ['part', 'isLastPart', 'clientMultipartId']),
        data: Readable.from(dataBuffer),
        size: dataBuffer.byteLength,
      },
      type,
      imageProps
    );

    await afterEach?.(result);
    return {...result, part: 1};
  };

  const runAll: RunAllFn = async runParams => {
    const result = await runNext(runParams);
    return compact([result]);
  };

  const startUpload = noopAsync;
  const completeUpload = noopAsync;

  return {runAll, runNext, dataBuffer, startUpload, completeUpload};
};

export const multipartFileUpload = async (params: {
  userToken: AgentToken | null;
  workspace: Workspace;
  fileInput?: Partial<UploadFileEndpointParams>;
  partLength?: number;
  clientMultipartId?: string;
  type?: GenerateTestFileType;
  imageProps?: IGenerateImageProps;
}): Promise<ITestUploadFnResult> => {
  const {
    userToken,
    workspace,
    partLength,
    clientMultipartId,
    imageProps,
    type,
  } = params;

  // fill in missing params to avoid insertFileForTest generating the params
  // internally leading to mismatch when uploading parts
  const padEmptyParams: Partial<UploadFileEndpointParams> = {
    filepath: addRootnameToPath(
      pathJoin({input: [generateTestFileName()]}),
      workspace.rootname
    ),
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const fileInput = merge(padEmptyParams, params.fileInput);
  const {dataBuffer} = await generateTestFileBinary({
    type,
    imageProps,
  });

  const partLengthOrDefault = partLength ?? 3;
  const clientMultipartIdOrDefault = clientMultipartId ?? getNewId();
  const completedParts: number[] = [];

  const uploadPart = async (part: number) => {
    const slicePart = part - 1;
    const partData = dataBuffer.subarray(
      slicePart * (dataBuffer.byteLength / partLengthOrDefault),
      (slicePart + 1) * (dataBuffer.byteLength / partLengthOrDefault)
    );

    const result = await insertFileForTest(userToken, workspace, {
      clientMultipartId: clientMultipartIdOrDefault,
      ...fileInput,
      part,
      data: Readable.from(partData),
      size: partData.byteLength,
    });

    completedParts.push(part);
    return result;
  };

  const startUpload = async () => {
    const reqData =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        userToken
          ? mockExpressRequestWithAgentToken(userToken)
          : mockExpressRequestForPublicAgent(),
        {
          clientMultipartId: clientMultipartIdOrDefault,
          fileId: fileInput.fileId,
          filepath: fileInput.filepath,
        }
      );

    const result = await startMultipartUpload(reqData);
    return result;
  };

  const completeUpload = async (
    params: {
      shouldWaitForJob?: boolean;
    } = {}
  ) => {
    const {shouldWaitForJob = true} = params;
    const reqData =
      RequestData.fromExpressRequest<CompleteMultipartUploadEndpointParams>(
        userToken
          ? mockExpressRequestWithAgentToken(userToken)
          : mockExpressRequestForPublicAgent(),
        {
          clientMultipartId: clientMultipartIdOrDefault,
          parts: completedParts.map(part => ({part})),
          fileId: fileInput.fileId,
          filepath: fileInput.filepath,
        }
      );

    const result = await completeMultipartUpload(reqData);
    if (shouldWaitForJob) {
      assert.ok(result.jobId);

      const job = await kIjxSemantic.job().getOneById(result.jobId);
      assert.ok(job);

      const jobResult = await runJob(job);
      assert.ok(jobResult);

      if (jobResult.status === kJobStatus.failed) {
        throw new Error(jobResult.errorMessage);
      }
    }

    return result;
  };

  const runOrder = Array.from({length: partLengthOrDefault}, (_, i) => i + 1);
  const ranSet = new Set<number>();

  const getNextPart = () => {
    return runOrder.find(part => !ranSet.has(part));
  };

  const runNext: RunNextFn = async runParams => {
    const {afterEach, forceRun} = runParams ?? {};
    const part = runParams?.part ?? getNextPart();

    if (
      !isNumber(part) ||
      part > partLengthOrDefault ||
      (ranSet.has(part) && !forceRun)
    ) {
      return null;
    }

    ranSet.add(part);
    const uploadResult = await uploadPart(part);
    const partResult = {...uploadResult, part};

    await afterEach?.(partResult);
    return partResult;
  };

  const runAll: RunAllFn = async runParams => {
    const {
      settlementType = kLoopAsyncSettlementType.all,
      shuffle = faker.datatype.boolean(),
    } = runParams ?? {};

    if (shuffle) {
      faker.helpers.shuffle(runOrder, {inplace: true});
    }

    let results: Array<Awaited<ReturnType<RunNextFn>>> = [];
    if (settlementType === kLoopAsyncSettlementType.oneByOne) {
      let partResult = await runNext(runParams);
      while (partResult) {
        results.push(partResult);
        partResult = await runNext();
      }
    } else {
      results = await Promise.all(
        runOrder.map(async part => {
          const result = await runNext({part, ...runParams});
          return result;
        })
      );
    }

    return compact(results);
  };

  return {runAll, runNext, dataBuffer, startUpload, completeUpload};
};

export const runUpload = async (
  isMultipart: boolean,
  singleParams: Parameters<typeof singleFileUpload>[0],
  multipartParams: Parameters<typeof multipartFileUpload>[0]
) => {
  if (isMultipart) {
    return await multipartFileUpload(multipartParams);
  }

  return await singleFileUpload(singleParams);
};

export const simpleRunUpload = async (
  isMultipart: boolean,
  uploadParams: Parameters<typeof singleFileUpload>[0]
) => {
  const {runAll, dataBuffer, startUpload, completeUpload} = await runUpload(
    isMultipart,
    /** singleParams */ uploadParams,
    /** multipartParams */ uploadParams
  );

  await startUpload();
  const runResults = await runAll();
  const completeResult = await completeUpload();

  const result = completeResult || last(runResults);
  assert.ok(result);
  const resFile = result.file;
  const dbFile = await kIjxSemantic.file().getOneById(resFile.resourceId);
  assert.ok(dbFile);

  return {dbFile, resFile, dataBuffer};
};
