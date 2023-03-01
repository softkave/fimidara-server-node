import {IResourceBase} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {DataQuery} from '../data/types';
import {MemoryCacheIndexHelper} from './MemoryCacheIndexHelper';
import {IResourceMemoryCache, IResourceMemoryCacheIndex, MakeIndexProps} from './types';

export class ResourceMemoryCache<T extends IResourceBase, Q extends DataQuery<T> = DataQuery<T>>
  implements IResourceMemoryCache<T, Q>
{
  private indexes: Record<string, IResourceMemoryCacheIndex<T>> = {};
  private data: Record<string, T> = {};

  constructor(props: {indexes?: Array<MakeIndexProps<T>>; initialData?: T[]}) {
    if (props.indexes) {
      props.indexes.forEach(indexProps => {
        this.indexes[indexProps.name] = MemoryCacheIndexHelper.makeIndex(indexProps);
      });
    }

    if (props.initialData) {
      props.initialData.forEach(item => {
        this.data[item.resourceId] = item;
      });
    }
  }

  async getDataMap() {
    return this.data;
  }

  async getDataList() {
    return Object.values(this.data);
  }

  async getIndex(name: string) {
    const index = this.indexes[name];
    appAssert(index, new ServerError(), `Index with name ${name} is required and not found.`);
    return index;
  }

  async getById(id: string) {
    return this.data[id];
  }
}
