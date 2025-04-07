import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {File} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {stringifyFilenamepath} from '../utils.js';

export async function prepareMountFilepath(params: {
  primaryMount: FileBackendMount;
  file: Pick<File, 'resourceId' | 'namepath' | 'ext'>;
}) {
  const {primaryMount, file} = params;
  const mountEntry = await kIjxSemantic
    .resolvedMountEntry()
    .getOneByMountIdAndFileId(primaryMount.resourceId, file.resourceId);

  const filepath = stringifyFilenamepath(
    mountEntry
      ? {namepath: mountEntry?.backendNamepath, ext: mountEntry?.backendExt}
      : file
  );

  return filepath;
}
