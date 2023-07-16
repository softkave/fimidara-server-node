import assert from 'assert';
import {Readable} from 'stream';
import {FimidaraEndpoints} from '../../publicEndpoints';
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

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

export const test_deleteFile = async () => {
  await deleteFileTestExecFn(fimidara, vars);
};

export const test_getFileDetails = async () => {
  await getFileDetailsTestExecFn(fimidara, vars);
};

export const test_readFile_blob = async () => {
  const result = await readFileTestExecFn(
    fimidara,
    vars,
    {responseType: 'blob'},
    {data: getTestFileReadStream(vars)}
  );
  const expectedString = await getTestFileString(vars);
  const body = result.body as Blob;
  const actualString = await body.text();
  assert.strictEqual(expectedString, actualString);
};

export const test_readFile_nodeReadable = async () => {
  const result = await readFileTestExecFn(
    fimidara,
    vars,
    {responseType: 'stream'},
    {data: getTestFileReadStream(vars)}
  );
  const expectedString = await getTestFileString(vars);
  const body = result.body as Readable;
  const actualString = await streamToString(body);
  assert.strictEqual(expectedString, actualString);
};

export const test_updateFileDetails = async () => {
  await updateFileDetailsTestExecFn(fimidara, vars);
};

export const test_uploadFile_nodeReadable = async () => {
  await uploadFileTestExecFn(fimidara, vars);
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
