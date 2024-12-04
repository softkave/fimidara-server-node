import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {File} from '../../../definitions/file.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {stringifyFilenamepath} from '../utils.js';

export async function prepareFilepath(params: {
  primaryMount: FileBackendMount;
  file: File;
}) {
  const {primaryMount, file} = params;
  const mountEntry = await kSemanticModels
    .resolvedMountEntry()
    .getOneByMountIdAndFileId(primaryMount.resourceId, file.resourceId);

  return stringifyFilenamepath(
    mountEntry
      ? {namepath: mountEntry?.backendNamepath, ext: mountEntry?.backendExt}
      : file
  );
}
