import {toArray} from 'lodash';
import {ReadonlyDeep} from 'type-fest';
import {OrPromise} from './types';

export interface DisposableResource {
  /** Dispose of resource in /src/endpoints/contexts/globalUtils.ts */
  close: () => OrPromise<void>;
}

export class DisposablesStore {
  map = new Map<DisposableResource, DisposableResource>();

  addDisposable = (disposable: DisposableResource | DisposableResource[]) => {
    toArray(disposable).forEach(next => this.map.set(next, next));
  };

  getDisposablesList = (): ReadonlyDeep<DisposableResource[]> => {
    return Array.from(this.map.values());
  };

  disposeAll = async () => {
    const promises: OrPromise<unknown>[] = [];

    for (const [disposable] of this.map) {
      promises.push(disposable.close());
    }

    return await Promise.all(promises);
  };
}
