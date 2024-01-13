import {ReadonlyDeep} from 'type-fest';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {toArray} from './fns';
import {OrPromise} from './types';

export interface DisposableResource {
  /** Dispose of resource in /src/endpoints/contexts/globalUtils.ts */
  dispose: () => OrPromise<void>;
}

/** NOTE: `DisposablesStore` must never be a disposable resource (basically any
 * resource with a `close()` function) because we automatically add all
 * disposable resources registered with our dep injection container into
 * `DisposablesStore`. */
export class DisposablesStore {
  protected disposablesMap = new Map<DisposableResource, DisposableResource>();

  add = (disposable: DisposableResource | DisposableResource[]) => {
    toArray(disposable).forEach(next => this.disposablesMap.set(next, next));
  };

  getMap = (): ReadonlyDeep<Map<DisposableResource, DisposableResource>> => {
    return this.disposablesMap;
  };

  getList = (): ReadonlyDeep<DisposableResource[]> => {
    return Array.from(this.disposablesMap.values());
  };

  disposeAll = () => {
    this.disposablesMap.forEach(disposable => {
      kUtilsInjectables.promises().forget(disposable.dispose());
    });
  };
}