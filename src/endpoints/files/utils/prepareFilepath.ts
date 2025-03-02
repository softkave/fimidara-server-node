import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {File} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {stringifyFilenamepath} from '../utils.js';

export async function prepareFilepath(params: {
  primaryMount: FileBackendMount;
  file: File;
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
