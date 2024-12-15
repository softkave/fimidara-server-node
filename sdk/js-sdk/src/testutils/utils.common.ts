import {faker} from '@faker-js/faker';
import assert from 'assert';
import {isObject} from 'lodash-es';
import {indexArray} from 'softkave-js-utils';
import {expect} from 'vitest';
import {fimidaraAddRootnameToPath} from '../path/fimidaraAddRootnameToPath.js';

// @ts-ignore
const env = import.meta.env;
assert.ok(isObject(env));

export interface ITestVars {
  workspaceId: string;
  workspaceRootname: string;
  authToken: string;
  testFilepath: string;
  testFolderPath: string;
  serverURL?: string;
  cwd: string;
}

export function getTestVars(): ITestVars {
  const workspaceId = env.FIMIDARA_TEST_WORKSPACE_ID;
  const authToken = env.FIMIDARA_TEST_AUTH_TOKEN;
  const testFilepath = env.FIMIDARA_TEST_FILEPATH;
  const testFolderPath = env.FIMIDARA_TEST_FOLDER_PATH;
  const workspaceRootname = env.FIMIDARA_TEST_WORKSPACE_ROOTNAME;
  const serverURL = env.FIMIDARA_SERVER_URL;
  const cwd = env.FIMIDARA_TEST_CWD;

  assert.ok(workspaceId);
  assert.ok(authToken);
  assert.ok(testFilepath);
  assert.ok(testFolderPath);
  assert.ok(workspaceRootname);
  assert.ok(cwd);

  return {
    workspaceId,
    workspaceRootname,
    authToken,
    testFilepath,
    testFolderPath,
    serverURL,
    cwd,
  };
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

export function generateTestFolderpath(vars: ITestVars) {
  return fimidaraAddRootnameToPath(
    faker.lorem.words(5).replaceAll(' ', '_'),
    vars.workspaceRootname
  );
}
