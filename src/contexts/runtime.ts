import {WithAccessors} from 'js-accessor/build/src/types.js';

interface IServerRuntimeStateRaw {
  isEnded: boolean;
  activeShardRunners: Record<string, boolean>;
}

export type IServerRuntimeState = WithAccessors<IServerRuntimeStateRaw>;
