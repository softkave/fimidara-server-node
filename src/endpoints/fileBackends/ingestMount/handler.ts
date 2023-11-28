import {container} from 'tsyringe';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendMountProvider} from '../../contexts/semantic/types';
import {NotFoundError} from '../../errors';
import {enqueueIngestMountJob} from '../../jobs/runner';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {IngestFileBackendMountEndpoint} from './types';
import {ingestFileBackendMountJoiSchema} from './validation';

const ingestFileBackendMount: IngestFileBackendMountEndpoint = async (
  context,
  instData
) => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, ingestFileBackendMountJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'ingestFileBackendMount', targetId: workspace.resourceId},
  });

  const mount = await mountModel.getOneById(data.mountId);
  appAssert(mount, new NotFoundError());

  const job = await enqueueIngestMountJob(context, {
    mountId: mount.resourceId,
  });

  return {jobId: job.resourceId};
};

export default ingestFileBackendMount;
