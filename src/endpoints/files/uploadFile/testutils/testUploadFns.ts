import {faker} from '@faker-js/faker';
import assert from 'assert';
import {compact, isNumber, merge, omit} from 'lodash-es';
import {
  getNewId,
  kLoopAsyncSettlementType,
  OrPromise,
  pathJoin,
} from 'softkave-js-utils';
import {Readable} from 'stream';
import {AgentToken} from '../../../../definitions/agentToken.js';
import {Workspace} from '../../../../definitions/workspace.js';
import {addRootnameToPath} from '../../../folders/utils.js';
import {generateTestFileName} from '../../../testUtils/generate/file.js';
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
      omit(fileInput, ['part', 'isLastPart', 'clientMultipartId']),
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

  const dataBuffer: Buffer | undefined = undefined;
  return {runAll, runNext, dataBuffer};
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
    return result;
  };

  const uploadLast = async () => {
    const buf = Buffer.alloc(0);
    return await insertFileForTest(userToken, workspace, {
      clientMultipartId: clientMultipartIdOrDefault,
      ...fileInput,
      part: -1,
      data: Readable.from(buf),
      size: buf.byteLength,
      isLastPart: true,
    });
  };

  const runOrder = Array.from({length: partLengthOrDefault}, (_, i) => i + 1);
  const ranSet = new Set<number>();

  const getNextPart = () => {
    return runOrder.find(part => !ranSet.has(part));
  };

  const runNext: RunNextFn = async runParams => {
    const {afterEach, forceRun} = runParams ?? {};
    const part = runParams?.part ?? getNextPart();

    if (part === -1) {
      const uploadResult = await uploadLast();
      const partResult = {...uploadResult, part};
      await afterEach?.(partResult);
      return partResult;
    }

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

      results.push(await runNext({part: -1, ...runParams}));
    } else {
      results = await Promise.all(
        runOrder.map(async part => {
          const result = await runNext({part, ...runParams});
          return result;
        })
      );
      results.push(await runNext({part: -1, ...runParams}));
    }

    return compact(results);
  };

  return {runAll, runNext, dataBuffer};
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
  const {runAll, dataBuffer} = await runUpload(
    isMultipart,
    /** singleParams */ uploadParams,
    /** multipartParams */ uploadParams
  );

  const results = await runAll();
  const result =
    results.length === 1
      ? results[0]
      : results.filter(r => r.reqData.data?.isLastPart)[0];
  assert.ok(result);
  return {...result, dataBuffer: dataBuffer ?? result.dataBuffer};
};
