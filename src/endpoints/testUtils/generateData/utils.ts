import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {AppActionType, AppResourceType} from '../../../definitions/system';

export type GeneratePartialTestDataFn<T> = (
  index: number,
  indexItem: T,
  cache: Record<string, any>
) => Partial<T>;

export const defaultGeneratePartialTestDataFn: GeneratePartialTestDataFn<any> = () => ({});

export function generateTestList<T, C extends Record<string, any> = Record<string, any>>(
  generareFullDataFn: (index: number, cache: Record<string, any>) => T,
  count = 20,
  generatePartialDataFn: GeneratePartialTestDataFn<T> = () => ({}),
  cache: C = <any>{}
) {
  const data: T[] = [];
  for (let i = 0; i < count; i++) {
    const f = generareFullDataFn(i, cache);
    const item = merge(f, generatePartialDataFn(i, f, cache));
    data.push(item);
  }
  return data;
}

export function randomResourceType(types: AppResourceType[] = Object.values(AppResourceType)) {
  return faker.helpers.arrayElement(types);
}

export function randomAction(actions = Object.values(AppActionType)) {
  return faker.helpers.arrayElement(actions);
}
