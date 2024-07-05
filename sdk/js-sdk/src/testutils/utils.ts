import {faker} from '@faker-js/faker';
import assert from 'assert';
import {createReadStream} from 'fs';
import {indexArray} from 'softkave-js-utils';
import {Readable} from 'stream';
import {expect} from 'vitest';
import {fimidaraAddRootnameToPath} from '../utils.js';
import path = require('path');

export interface ITestVars {
  workspaceId: string;
  workspaceRootname: string;
  authToken: string;
  testFilepath: string;
  serverURL?: string;
}

export function makeTestFilepath(workspaceRootname: string, filepath: string) {
  return path.posix.normalize('/' + workspaceRootname + '/' + filepath);
}

export function getTestVars(): ITestVars {
  const workspaceId = process.env.FIMIDARA_TEST_WORKSPACE_ID;
  const authToken = process.env.FIMIDARA_TEST_AUTH_TOKEN;
  const testFilepath = process.env.FIMIDARA_TEST_FILEPATH;
  const workspaceRootname = process.env.FIMIDARA_TEST_WORKSPACE_ROOTNAME;
  const serverURL = process.env.FIMIDARA_SERVER_URL;
  assert.ok(workspaceId);
  assert.ok(authToken);
  assert.ok(testFilepath);
  assert.ok(workspaceRootname);
  return {workspaceId, workspaceRootname, authToken, testFilepath, serverURL};
}

export function containsEveryItemIn<T2, T1 extends T2>(
  list1: T1[],
  list2: T2[],
  indexer: (item: T2) => string
) {
  const list1Map = indexArray(list1, {indexer});
  list2.forEach(item1 => {
    const k = indexer(item1);
    const item2 = list1Map[k];
    expect(item2).toBeTruthy();
  });
}

export function containsNoneIn<T2, T1 extends T2>(
  list1: T1[],
  list2: T2[],
  indexer: (item: T2) => string
) {
  const list1Map = indexArray(list1, {indexer});
  list2.forEach(item1 => {
    const k = indexer(item1);
    const item2 = list1Map[k];
    expect(item2).toBeFalsy();
  });
}

export function containsExactly<T2, T1 extends T2>(
  list1: T1[],
  list2: T2[],
  indexer: (item: T2) => string
) {
  expect(list1.length).toEqual(list2.length);
  containsEveryItemIn(list1, list2, indexer);
}

export function indexByResourceId(resource: {resourceId: string}) {
  return resource.resourceId;
}

export function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
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

export function generateTestFolderpath(vars: ITestVars) {
  return fimidaraAddRootnameToPath(
    faker.lorem.words(5).replaceAll(' ', '_'),
    vars.workspaceRootname
  );
}
