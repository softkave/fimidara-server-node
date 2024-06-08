import {readFile} from 'fs/promises';
import {memoize} from 'lodash-es';

export type PackageJson = Partial<{
  version: string;
}>;

export async function getPackageJson(filepath: string) {
  const rawTxt = await readFile(filepath, 'utf-8');
  return JSON.parse(rawTxt);
}

export const memoizedGetPackageJson = memoize(getPackageJson);
