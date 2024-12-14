import assert from 'assert';
import {Readable} from 'stream';
import {expect} from 'vitest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {ReadFileEndpointParams} from '../../endpoints/publicTypes.js';
import {
  deleteFileTestExecFn,
  getFileDetailsTestExecFn,
  readFileTestExecFn,
  updateFileDetailsTestExecFn,
  uploadFileTestExecFn,
} from '../execFns/file.js';
import {ITestVars, getTestVars} from '../utils.common.js';
import {
  getTestFileReadStream,
  getTestFileString,
  getTestStreamByteLength,
  streamToString,
} from '../utils.node.js';

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
  props: ReadFileEndpointParams = {}
) => {
  const result = await readFileTestExecFn(
    fimidaraTestInstance,
    fimidaraTestVars,
    props,
    {responseType: 'blob'},
    {data: getTestFileReadStream(fimidaraTestVars)}
  );

  const expectedString = await getTestFileString(fimidaraTestVars);
  const body = result;
  const actualString = await body.text();
  assert.strictEqual(expectedString, actualString);

  return {result, bodyStr: actualString};
};

export const test_readFile_nodeReadable = async (
  props: ReadFileEndpointParams = {}
) => {
  const result = await readFileTestExecFn(
    fimidaraTestInstance,
    fimidaraTestVars,
    props,
    {responseType: 'stream'},
    {
      data: getTestFileReadStream(fimidaraTestVars),
      size: await getTestStreamByteLength(
        getTestFileReadStream(fimidaraTestVars)
      ),
    }
  );

  const expectedString = await getTestFileString(fimidaraTestVars);
  const body = result;
  const actualString = await streamToString(body);
  expect(expectedString).toEqual(actualString);

  return {result, bodyStr: actualString};
};

export const test_updateFileDetails = async () => {
  await updateFileDetailsTestExecFn(fimidaraTestInstance, fimidaraTestVars);
};

export const test_uploadFile_nodeReadable = async () => {
  return await uploadFileTestExecFn(fimidaraTestInstance, fimidaraTestVars);
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
