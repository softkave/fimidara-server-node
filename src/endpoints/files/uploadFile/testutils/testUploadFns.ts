import {faker} from '@faker-js/faker';
import assert from 'assert';
import {compact, isNumber, last} from 'lodash-es';
import {kLoopAsyncSettlementType, OrPromise} from 'softkave-js-utils';
import {Readable} from 'stream';
import {AgentToken} from '../../../../definitions/agentToken.js';
import {Workspace} from '../../../../definitions/workspace.js';
import {
  generateTestFileBinary,
  GenerateTestFileType,
} from '../../../testUtils/generate/file/generateTestFileBinary.js';
import {IGenerateImageProps} from '../../../testUtils/generate/file/generateTestImage.js';
import {insertFileForTest} from '../../../testUtils/testUtils.js';
import {UploadFileEndpointParams} from '../types.js';

type AfterEachFn = (
  partResult: Awaited<ReturnType<typeof insertFileForTest>>
) => OrPromise<void>;

type RunAllFn = (params?: {
  shuffle?: boolean;
  afterEach?: AfterEachFn;
  settlementType?:
    | typeof kLoopAsyncSettlementType.all
    | typeof kLoopAsyncSettlementType.oneByOne;
}) => Promise<Awaited<ReturnType<typeof insertFileForTest>>[]>;

type RunNextFn = (params?: {
  forceRun?: boolean;
  part?: number;
  afterEach?: AfterEachFn;
}) => Promise<
  (Awaited<ReturnType<typeof insertFileForTest>> & {part: number}) | null
>;

export const singleFileUpload = async (params: {
  userToken: AgentToken | null;
  workspace: Workspace;
  fileInput?: Partial<UploadFileEndpointParams>;
  type?: GenerateTestFileType;
  imageProps?: IGenerateImageProps;
}) => {
  const {userToken, workspace, fileInput, type, imageProps} = params;

  const runNext: RunNextFn = async runParams => {
    const {afterEach} = runParams ?? {};
    const result = await insertFileForTest(
      userToken,
      workspace,
      fileInput,
      type,
      imageProps
    );

    await afterEach?.(result);
    return {...result, part: 0};
  };

  const runAll: RunAllFn = async runParams => {
    const result = await runNext(runParams);
    return compact([result]);
  };

  return {runAll, runNext};
};

export const multipartFileUpload = async (params: {
  userToken: AgentToken | null;
  workspace: Workspace;
  fileInput?: Partial<UploadFileEndpointParams>;
  partLength?: number;
  clientMultipartId?: string;
  type?: GenerateTestFileType;
  imageProps?: IGenerateImageProps;
}) => {
  const {
    userToken,
    workspace,
    fileInput,
    partLength,
    clientMultipartId,
    imageProps,
    type,
  } = params;

  const {dataBuffer} = await generateTestFileBinary({
    type,
    imageProps,
  });
  const partLengthOrDefault = partLength ?? 3;
  const clientMultipartIdOrDefault = clientMultipartId ?? '1';
  const uploadPart = async (part: number) => {
    const partData = dataBuffer.subarray(
      part * (dataBuffer.byteLength / partLengthOrDefault),
      (part + 1) * (dataBuffer.byteLength / partLengthOrDefault)
    );
    return await insertFileForTest(userToken, workspace, {
      ...fileInput,
      part,
      data: Readable.from(partData),
      size: partData.byteLength,
      clientMultipartId: clientMultipartIdOrDefault,
      partLength: partLengthOrDefault,
    });
  };

  const runOrder = Array.from({length: partLengthOrDefault}, (_, i) => i);
  const ranSet = new Set<number>();

  const getNextPart = () => {
    return runOrder.find(part => !ranSet.has(part));
  };

  const runNext: RunNextFn = async runParams => {
    const {afterEach, forceRun} = runParams ?? {};
    const part = runParams?.part ?? getNextPart();
    if (
      !isNumber(part) ||
      part >= partLengthOrDefault ||
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

    const results = [];
    if (settlementType === kLoopAsyncSettlementType.oneByOne) {
      let partResult = await runNext(runParams);
      while (partResult) {
        results.push(partResult);
        partResult = await runNext();
      }
    } else {
      await Promise.all(runOrder.map(part => runNext({part, ...runParams})));
    }

    return results;
  };

  return {runAll, runNext};
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
  const {runAll} = await runUpload(
    isMultipart,
    /** singleParams */ uploadParams,
    /** multipartParams */ uploadParams
  );

  const results = await runAll();
  const result = last(results);
  assert.ok(result);
  return result;
};
