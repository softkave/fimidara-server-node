import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkCollaboratorAuthorization02} from '../utils.js';
import {RemoveCollaboratorEndpoint} from './types.js';
import {beginDeleteCollaborator} from './utils.js';
import {removeCollaboratorJoiSchema} from './validation.js';

const removeCollaboratorEndpoint: RemoveCollaboratorEndpoint =
  async reqData => {
    const data = validate(reqData.data, removeCollaboratorJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {collaborator} = await checkCollaboratorAuthorization02(
      agent,
      workspaceId,
      data.collaboratorId,
      kFimidaraPermissionActions.removeCollaborator
    );

    const [job] = await beginDeleteCollaborator({
      agent,
      workspaceId,
      resources: [collaborator],
    });
    appAssert(job);

    return {jobId: job.resourceId};
  };

export default removeCollaboratorEndpoint;
