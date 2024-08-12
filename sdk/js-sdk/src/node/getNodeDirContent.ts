import {Stats} from 'fs';
import {opendir} from 'fs/promises';
import {FimidaraDiffExternalFile} from '../diff/types.js';
import {nodeFileToExternalFile} from './nodeFileToExternalFile.js';

export async function getNodeDirContent(props: {folderpath: string}) {
  const {folderpath} = props;
  const dir = await opendir(folderpath);
  const efRecord: Record<string, FimidaraDiffExternalFile> = {};
  const folderStatsRecord: Record<string, Stats> = {};
  const fileStatsRecord: Record<string, Stats> = {};

  // TODO: optimize
  for await (const df of dir) {
    const {externalFile, stats} = await nodeFileToExternalFile({dirent: df});

    if (externalFile) {
      efRecord[externalFile.name] = externalFile;
      fileStatsRecord[externalFile.name] = stats;
    }

    if (stats.isDirectory()) {
      folderStatsRecord[df.name] = stats;
    }
  }

  return {folderStatsRecord, fileStatsRecord, externalFilesRecord: efRecord};
}
