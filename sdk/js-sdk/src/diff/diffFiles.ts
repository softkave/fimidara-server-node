import {isArray} from 'lodash-es';
import {indexArray} from 'softkave-js-utils';
import {File as FimidaraFile} from '../endpoints/publicTypes.js';
import {stringifyFimidaraFilename} from '../path/index.js';
import type {FimidaraDiffExternalFile} from './types.js';

export function diffFiles<
  TExternalFile extends FimidaraDiffExternalFile = FimidaraDiffExternalFile,
  TFimidaraFile extends Pick<
    FimidaraFile,
    'name' | 'ext' | 'lastUpdatedAt'
  > = Pick<FimidaraFile, 'name' | 'ext' | 'lastUpdatedAt'>
>(props: {
  fimidaraFiles: TFimidaraFile[] | Record<string, TFimidaraFile>;
  externalFiles: TExternalFile[] | Record<string, TExternalFile>;
}) {
  const {fimidaraFiles, externalFiles} = props;

  const efMap = isArray(externalFiles)
    ? indexArray(externalFiles, {indexer: f => f.name})
    : externalFiles;
  const ffMap = isArray(fimidaraFiles) ? {} : fimidaraFiles;

  const newFFRecord: Record<string, TFimidaraFile> = {};
  const newEFRecord: Record<string, TExternalFile> = {};
  const updatedFFRecord: Record<string, TFimidaraFile> = {};
  const updatedEFRecord: Record<string, TExternalFile> = {};
  const unmodifiedFFRecord: Record<string, TFimidaraFile> = {};
  const unmodifiedEFRecord: Record<string, TExternalFile> = {};

  for (const k in fimidaraFiles) {
    const ff = fimidaraFiles[k as keyof typeof fimidaraFiles] as TFimidaraFile;
    const ffName = stringifyFimidaraFilename(ff);
    const ef = efMap[ffName];
    ffMap[ffName] = ff;

    if (ef) {
      if (ef.lastModified < ff.lastUpdatedAt) {
        updatedFFRecord[ffName] = ff;
      } else if (ef.lastModified > ff.lastUpdatedAt) {
        updatedEFRecord[ef.name] = ef;
      } else {
        unmodifiedEFRecord[ef.name] = ef;
        unmodifiedFFRecord[ffName] = ff;
      }
    } else {
      newFFRecord[ffName] = ff;
    }
  }

  for (const k in externalFiles) {
    const ef = externalFiles[k as keyof typeof externalFiles] as TExternalFile;
    const ff = ffMap[ef.name];

    if (ff) {
      const ffName = stringifyFimidaraFilename(ff);

      if (ef.lastModified < ff.lastUpdatedAt) {
        updatedFFRecord[ffName] = ff;
      } else if (ef.lastModified > ff.lastUpdatedAt) {
        updatedEFRecord[ef.name] = ef;
      } else {
        unmodifiedEFRecord[ef.name] = ef;
        unmodifiedFFRecord[ffName] = ff;
      }
    } else {
      newEFRecord[ef.name] = ef;
    }
  }

  return {
    newFimidaraFileRecord: newFFRecord,
    updatedFimidaraFileRecord: updatedFFRecord,
    unmodifiedFimidaraFileRecord: unmodifiedFFRecord,
    newExternalFileRecord: newEFRecord,
    updatedExternalFileRecord: updatedEFRecord,
    unmodifiedExternalFileRecord: unmodifiedEFRecord,
    newFimidaraFileList: Object.values(newFFRecord),
    updatedFimidaraFileList: Object.values(updatedFFRecord),
    unmodifiedFimidaraFileList: Object.values(unmodifiedFFRecord),
    newExternalFileList: Object.values(newEFRecord),
    updatedExternalFileList: Object.values(updatedEFRecord),
    unmodifiedExternalFileList: Object.values(unmodifiedEFRecord),
  };
}
