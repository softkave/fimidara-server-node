import {ObjectValues} from '../utils/types';
import {Resource} from './system';

export const kAppType = {
  runner: 'runner',
  server: 'server',
} as const;

export const kAppPresetShards = {
  fimidaraMain: 'fimidaraMain',
};

export type AppType = ObjectValues<typeof kAppType>;
export type AppPresetShards = ObjectValues<typeof kAppPresetShards>;
export type AppShard = number | string;

export interface App extends Resource {
  type: AppType;
  shard: AppShard;
  // ipv4: string | undefined;
  // ipv6: string | undefined;
  // httpPort: string | undefined;
  // httpsPort: string | undefined;
  // version: string | undefined;
}
