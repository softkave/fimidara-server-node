import assert from 'assert';
import {merge} from 'lodash-es';
import {Readable} from 'stream';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints';
import {ReadFileEndpointParams} from '../../publicTypes';
import {FimidaraEndpointWithBinaryResponseParamsOptional} from '../../utils';
import {
  deleteFileTestExecFn,
  getFileDetailsTestExecFn,
  readFileTestExecFn,
  updateFileDetailsTestExecFn,
  uploadFileTestExecFn,
} from '../execFns/file';
import {
  ITestVars,
  getTestFileReadStream,
  getTestFileString,
  getTestVars,
  streamToString,
} from '../utils';

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
    FimidaraEndpointWithBinaryResponseParamsOptional<ReadFileEndpointParams>
  > = {}
) => {
  const result = await readFileTestExecFn(
    fimidaraTestInstance,
    fimidaraTestVars,
    merge({}, props, {responseType: 'blob'}),
    {data: getTestFileReadStream(fimidaraTestVars)}
  );

  const expectedString = await getTestFileString(fimidaraTestVars);
  const body = result.body as Blob;
  const actualString = await body.text();
  assert.strictEqual(expectedString, actualString);

  return {result, bodyStr: actualString};
};

export const test_readFile_nodeReadable = async (
  props: PartialDeep<
    FimidaraEndpointWithBinaryResponseParamsOptional<ReadFileEndpointParams>
  > = {}
) => {
  const result = await readFileTestExecFn(
    fimidaraTestInstance,
    fimidaraTestVars,
    merge({}, props, {responseType: 'stream'}),
    {data: getTestFileReadStream(fimidaraTestVars)}
  );

  const expectedString = await getTestFileString(fimidaraTestVars);
  const body = result.body as Readable;
  const actualString = await streamToString(body);
  assert.strictEqual(expectedString, actualString);

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
  await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars, {
    data: text,
  });
};

export const test_uploadFile_nodeReadableNotFromFile = async () => {
  const stringStream = Readable.from([
    'Hello world! Node Readable stream not from file test',
  ]);
  await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars, {
    data: stringStream,
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
