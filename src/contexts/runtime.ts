import {construct} from 'js-accessor';
import {WithAccessors} from 'js-accessor/build/src/types.js';

interface IServerRuntimeStateRaw {
  isEnded: boolean;
}

export const fimidaraRuntimeState = construct<IServerRuntimeStateRaw>({});

export type IServerRuntimeState = WithAccessors<IServerRuntimeStateRaw>;
