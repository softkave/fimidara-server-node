import {createReadStream, ReadStream} from 'fs';
import {Readable} from 'stream';
import path = require('path-browserify');
import {ITestVars} from './utils.common.js';

export function makeTestFilepath(workspaceRootname: string, filepath: string) {
  return path.posix.normalize('/' + workspaceRootname + '/' + filepath);
}

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', function handleData(chunk) {
      chunks.push(chunk);
    });
    stream.on('end', function handleEnd() {
      resolve(Buffer.concat(chunks));
    });
    stream.on('error', function handleError(err) {
      reject(err);
    });
    stream.on('aborted', function handleAborted(err) {
      stream.destroy(err);
      reject(err);
    });
  });
}

export function streamToString(stream: Readable): Promise<string> {
  return streamToBuffer(stream).then(buffer => buffer.toString('utf8'));
}

export function getTestFileReadStream(vars: ITestVars) {
  const incomingFilepath = path.normalize(process.cwd() + vars.testFilepath);
  return createReadStream(incomingFilepath);
}

export async function getTestFileString(vars: ITestVars) {
  const stream = getTestFileReadStream(vars);
  return await streamToString(stream);
}

export async function getTestFileByteLength(vars: ITestVars) {
  const str = await getTestFileString(vars);
  return Buffer.byteLength(str);
}

export async function getTestStreamByteLength(stream: ReadStream) {
  const str = await streamToString(stream);
  return Buffer.byteLength(str);
}
