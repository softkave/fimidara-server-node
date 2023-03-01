import {get, isFunction, isString} from 'lodash';
import {IResourceBase} from '../../../definitions/system';
import {MemoryCacheIndexKeys} from './MemoryCacheIndexKeys';
import {IResourceMemoryCacheIndex, MakeIndexProps, SingleIndex} from './types';
import {INDEX_PLACEHOLDER_VALUE} from './utils';

export class MemoryCacheIndexHelper {
  static indexItem<T extends IResourceBase>(item: T, index: IResourceMemoryCacheIndex<T>) {
    let key: string;
    if (isFunction(index.indexer)) {
      key = index.indexer(item);
    } else {
      const values = index.indexer.fields.map(p => {
        const value = get(item, p);
        if (isString(value)) {
          return value;
        } else {
          return String(value);
        }
      });

      key = MemoryCacheIndexKeys.makeKey(values);
      if (index.indexer.transformKey) {
        key = index.indexer.transformKey(key, item);
      }
    }

    if (key) {
      if (index.indexes[key]) {
        index.indexes[key][item.resourceId] = INDEX_PLACEHOLDER_VALUE;
      }
    }
  }

  static indexItemWithIndexList<T extends IResourceBase>(
    item: T,
    indexList: IResourceMemoryCacheIndex<T>[]
  ) {
    for (const index of indexList) {
      MemoryCacheIndexHelper.indexItem(item, index);
    }
  }

  static indexItemListWithIndexList<T extends IResourceBase>(
    itemList: T[],
    indexList: IResourceMemoryCacheIndex<T>[]
  ) {
    for (const item of itemList) {
      MemoryCacheIndexHelper.indexItemWithIndexList(item, indexList);
    }
  }

  static makeIndex<T extends IResourceBase>(
    props: MakeIndexProps<T>
  ): IResourceMemoryCacheIndex<T> {
    return {
      ...props,
      indexes: {},
    };
  }

  static getIndex<T extends IResourceBase>(props: {
    key: string;
    index: IResourceMemoryCacheIndex<T>;
  }) {
    return props.index.indexes[props.key] ?? {};
  }

  static intersection(indexList: SingleIndex[]) {
    const [leadIndex, ...restIndex] = indexList;
    const intersectionList: string[] = [];
    for (const id in leadIndex) {
      const notFound = restIndex.some(index => !index[id]);
      if (notFound === false) {
        intersectionList.push(id);
      }
    }

    return intersectionList;
  }
}
