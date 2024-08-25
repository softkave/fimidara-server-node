import assert from 'assert';
import {merge} from 'lodash-es';
import {Readable} from 'stream';
import {PartialDeep} from 'type-fest';
import {expect} from 'vitest';
import {FimidaraEndpoints} from '../../publicEndpoints.js';
import {ReadFileEndpointParams} from '../../publicTypes.js';
import {FimidaraEndpointWithBinaryResponseParamsOptional} from '../../utils.js';
import {
  deleteFileTestExecFn,
  getFileDetailsTestExecFn,
  readFileTestExecFn,
  updateFileDetailsTestExecFn,
  uploadFileTestExecFn,
} from '../execFns/file.js';
import {
  ITestVars,
  getTestFileReadStream,
  getTestFileString,
  getTestStreamByteLength,
  getTestVars,
  streamToString,
} from '../utils.js';

export const fimidaraTestVars: ITestVars = getTestVars();
export const fimidaraTestInstance = new FimidaraEndpoints({
  authToken: fimidaraTestVars.authToken,
  serverURL: fimidaraTestVars.serverURL,
});

export const test_deleteFile = async () => {
  await deleteFileTestExecFn(fimidaraTestInstance, fimidaraTestVars);
};

export const test_getFileDetails = async () => {
  await getFileDetailsTestExecFn(fimidaraTestInstance, fimidaraTestVars);
};

export const test_readFile_blob = async (
  props: PartialDeep<
    FimidaraEndpointWithBinaryResponseParamsOptional<
      ReadFileEndpointParams,
      'blob'
    >
  > = {}
) => {
  const result = await readFileTestExecFn(
    fimidaraTestInstance,
    fimidaraTestVars,
    /** responseType */ 'blob',
    merge({}, props),
    {data: getTestFileReadStream(fimidaraTestVars)}
  );

  const expectedString = await getTestFileString(fimidaraTestVars);
  const body = result.body;
  const actualString = await body.text();
  assert.strictEqual(expectedString, actualString);

  return {result, bodyStr: actualString};
};

export const test_readFile_nodeReadable = async (
  props: PartialDeep<
    FimidaraEndpointWithBinaryResponseParamsOptional<
      ReadFileEndpointParams,
      'stream'
    >
  > = {}
) => {
  const result = await readFileTestExecFn(
    fimidaraTestInstance,
    fimidaraTestVars,
    /** responseType */ 'stream',
    merge({}, props),
    {
      data: getTestFileReadStream(fimidaraTestVars),
      size: await getTestStreamByteLength(
        getTestFileReadStream(fimidaraTestVars)
      ),
    }
  );

  const expectedString = await getTestFileString(fimidaraTestVars);
  const body = result.body;
  const actualString = await streamToString(body);
  expect(expectedString).toEqual(actualString);

  return {result, bodyStr: actualString};
};

export const test_updateFileDetails = async () => {
  await updateFileDetailsTestExecFn(fimidaraTestInstance, fimidaraTestVars);
};

export const test_uploadFile_nodeReadable = async () => {
  await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars);
};

export const test_uploadFile_string = async () => {
  const text = 'Hello World!';
  const buf = Buffer.from(text);
  await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars, {
    data: text,
    size: buf.byteLength,
  });
};

export const test_uploadFile_nodeReadableNotFromFile = async () => {
  const buf = Buffer.from(
    'Hello world! Node Readable stream not from file test'
  );
  const stringStream = Readable.from([buf]);
  await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars, {
    data: stringStream,
    size: buf.byteLength,
  });
};

// export const test_uploadFile_readableStream = async () => {
//   const expectedString = faker.lorem.paragraph();
//   const stream = new ReadableStream({
//     start(controller) {
//       // Add the string to the stream and close
//       controller.enqueue(expectedString);
//       controller.close();
//     },
//     pull(controller) {},
//     cancel() {},
//   });
//   const uploadFileResult = await uploadFileTestExecFn(fimidara, vars, {
//     data: stream,
//   });
//   const readFileResult = await readFileTestExecFn(fimidara, vars, {
//     responseType: 'blob',
//     body: {fileId: uploadFileResult.body.file.resourceId},
//   });
//   const body = readFileResult.body as Blob;
//   const actualString = await body.text();
//   assert.strictEqual(expectedString, actualString);
// };
