import assert = require('assert');
import {get, isArray, last} from 'lodash';
import path = require('path');

export interface ITestVars {
  workspaceId: string;
  workspaceRootname: string;
  authToken: string;
  testFilepath: string;
}

export function makeTestFilepath(workspaceRootname: string, filepath: string) {
  return path.posix.normalize('/' + workspaceRootname + '/' + filepath);
}

export function getTestVars(): ITestVars {
  const workspaceId = process.env.FIMIDARA_TEST_WORKSPACE_ID;
  const authToken = process.env.FIMIDARA_TEST_AUTH_TOKEN;
  const testFilepath = process.env.FIMIDARA_TEST_FILEPATH;
  const workspaceRootname = process.env.FIMIDARA_TEST_WORKSPACE_ROOTNAME;
  assert.ok(workspaceId);
  assert.ok(authToken);
  assert.ok(testFilepath);
  assert.ok(workspaceRootname);
  return {
    workspaceId,
    workspaceRootname,
    authToken,
    testFilepath,
  };
}

export type LoopAndCollateFn<R> = (index: number) => R;

export function loopAndCollate<Fn extends LoopAndCollateFn<any>>(
  count = 1,
  fn: Fn
): Array<ReturnType<Fn>> {
  const result: Array<ReturnType<Fn>> = [];
  while (count > 0) {
    result.push(fn(count));
    count -= 1;
  }
  return result;
}

export function cast<T>(value: any) {
  return value as T;
}

export function addRootnameToPath<
  T extends string | string[] = string | string[]
>(path: T, workspaceRootname: string | string[]): T {
  const rootname = isArray(workspaceRootname)
    ? last(workspaceRootname)
    : workspaceRootname;

  if (isArray(path)) {
    return <T>[rootname, ...path];
  }

  return <T>`${rootname}/${path}`;
}

export function folderpathListToString(filepath: string[]) {
  return filepath.join('/');
}

export function filepathListToString(filepath: string[], extension?: string) {
  return filepath.join('/') + extension ? `.${extension}` : '';
}

function defaultIndexer(data: any, path: any) {
  if (path) {
    return get(data, path);
  }
  if (data && data.toString) {
    return data.toString();
  }
  return String(data);
}

function defaultReducer(data: any) {
  return data;
}

type GetPathType<T> = T extends {[key: string]: any} ? keyof T : undefined;

export interface IIndexArrayOptions<T, R> {
  path?: GetPathType<T>;
  indexer?: (
    current: T,
    path: GetPathType<T>,
    arr: T[],
    index: number
  ) => string;
  reducer?: (current: T, arr: T[], index: number) => R;
}

export function indexArray<T, R = T>(
  arr: T[] = [],
  opts: IIndexArrayOptions<T, R> = {}
): {[key: string]: R} {
  const indexer = opts.indexer || defaultIndexer;
  const path = opts.path;
  const reducer = opts.reducer || defaultReducer;
  if (typeof indexer !== 'function') {
    if (typeof path !== 'string') {
      throw new Error('Path must be provided if an indexer is not provided');
    }
  }

  const result = arr.reduce((accumulator, current, index) => {
    const key = indexer(current, path as any, arr, index);
    accumulator[key] = reducer(current, arr, index);
    return accumulator;
  }, {} as {[key: string]: R});

  return result;
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
