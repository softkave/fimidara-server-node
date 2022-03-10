import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkFileAuthorization03, FileUtils} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const organizationId = getOrganizationId(agent, data.organizationId);
  const {file} = await checkFileAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Read
  );

  return {
    file: FileUtils.getPublicFile(file),
  };
};

export default getFileDetails;
