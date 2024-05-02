import {AnyFn} from './types.js';

export type ListenableResourceListener<T> = AnyFn<[T | undefined]>;

export class ListenableResource<T> {
  protected data?: T;
  protected listeners: Map<ListenableResourceListener<T>, ListenableResourceListener<T>> =
    new Map();

  constructor(data?: T) {
    this.data = data;
  }

  listen(fn: ListenableResourceListener<T>) {
    this.listeners.set(fn, fn);
  }

  removeListener(fn: AnyFn) {
    this.listeners.delete(fn);
  }

  clearListeners() {
    this.listeners = new Map();
  }

  get() {
    return this.data;
  }

  set(data: T) {
    this.data = data;
    this.broadcast();
  }

  protected broadcast() {
    this.listeners.forEach(fn => fn(this.data));
  }
}
