import {WithAccessors} from 'js-accessor/build/src/types.js';

interface IServerRuntimeStateRaw {
  isEnded: boolean;
}

export type IServerRuntimeState = WithAccessors<IServerRuntimeStateRaw>;
