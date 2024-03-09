import {ValueOf} from 'type-fest';

export interface FimidaraDeployLocalConfig {
  pwd: string;
  configFile: string;
  envFile: string;
  gitTagsFile: string;
  sudoPassword: string;
}

export interface FimidaraDeployForeignConfig {
  sshAddress: string;
  sshPassword: string;
  pwd: string;
  gitTagsFile: string;
  sudoPassword: string;
}

export const kFimidaraDeployOpLogEvent = {
  gitPull: 'gitPull',
  npmInstall: 'npmInstall',
} as const;

export type FimdaraDeployOpLogEvent = ValueOf<typeof kFimidaraDeployOpLogEvent>;

export interface FimidaraDeployOpLogItem {
  event: FimdaraDeployOpLogEvent;
  timestamp: number;
  message?: string;
}

export type FimidaraDeployOpLogItemInput = Pick<
  FimidaraDeployOpLogItem,
  'event' | 'message'
>;
