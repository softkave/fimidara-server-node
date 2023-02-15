import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';

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

export function randomResourceType() {
  return faker.helpers.arrayElement(Object.values(AppResourceType));
}

export function randomAction() {
  return faker.helpers.arrayElement(Object.values(BasicCRUDActions));
}

export function randomPermissionAppliesTo() {
  return faker.helpers.arrayElement(Object.values(PermissionItemAppliesTo));
}
