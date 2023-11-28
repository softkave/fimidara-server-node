import {pick} from 'lodash';
import {container} from 'tsyringe';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {EncryptionProvider} from '../../contexts/encryption/types';
import {kInjectionKeys} from '../../contexts/injection';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderUtils,
} from '../../contexts/semantic/types';
import {NotFoundError} from '../../errors';
import {areFolderpathsEqual} from '../../folders/utils';
import {enqueuePurgeMountFromFolderJob} from '../../jobs/runner';
import {isResourceNameEqual} from '../../utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountExtractor, mountExists, mountNameExists} from '../utils';
import {UpdateFileBackendMountEndpoint} from './types';
import {updateFileBackendMountJoiSchema} from './validation';

const updateFileBackendMount: UpdateFileBackendMountEndpoint = async (
  context,
  instData
) => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );
  const semanticUtils = container.resolve<SemanticProviderUtils>(
    kInjectionKeys.semantic.utils
  );
  const encryptionProvider = container.resolve<EncryptionProvider>(
    kInjectionKeys.encryption
  );

  const data = validate(instData.data, updateFileBackendMountJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'updateFileBackendMount', targetId: workspace.resourceId},
  });

  const updatedMount = await semanticUtils.withTxn(async opts => {
    const mount = await mountModel.getOneById(data.mountId, opts);
    appAssert(mount, new NotFoundError('File backend mount not found.'));

    const mountUpdate: Partial<FileBackendMount> = {
      ...pick(data.mount, [
        'configId',
        'folderpath',
        'index',
        'mountedFrom',
        'name',
        'description',
      ]),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };

    const isFolderpathChanged =
      data.mount.folderpath &&
      !areFolderpathsEqual(data.mount.folderpath, mount.folderpath);
    const isMountedFromChanged =
      data.mount.mountedFrom && data.mount.mountedFrom !== mount.mountedFrom;

    if (isFolderpathChanged || isMountedFromChanged) {
      const exists = await mountExists(
        {
          product: mount.product,
          folderpath: data.mount.folderpath || mount.folderpath,
          mountedFrom: data.mount.mountedFrom || mount.mountedFrom,
        },
        opts
      );

      if (exists) {
        throw kReuseableErrors.mount.mountExists();
      }
    }

    if (data.mount.name && !isResourceNameEqual(data.mount.name, mount.name)) {
      const nameExists = await mountNameExists({
        workspaceId: workspace.resourceId,
        name: data.mount.name,
      });

      if (nameExists) {
        throw kReuseableErrors.mount.mountNameExists(data.mount.name);
      }
    }

    if (
      isFolderpathChanged ||
      isMountedFromChanged ||
      (data.mount.index && data.mount.index !== mount.index)
    ) {
      await enqueuePurgeMountFromFolderJob({}, opts);
    }

    return await mountModel.getAndUpdateOneById(mount.resourceId, mountUpdate, opts);
  });

  appAssert(updatedMount);
  return {mount: fileBackendMountExtractor(updatedMount)};
};

export default updateFileBackendMount;
