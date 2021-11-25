import {validate} from '../../../utilities/validate';
import {collaboratorExtractor} from '../utils';
import {UpdateCollaboratorPresetsEndpoint} from './types';
import {updateCollaboratorPresetsJoiSchema} from './validation';

const updateCollaboratorPresets: UpdateCollaboratorPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaboratorPresetsJoiSchema);
  const user = await context.session.getUser(context, instData);
  const collaborator = await context.data.user.assertGetItem();

  const publicData = collaboratorExtractor(collaborator);
  return {
    collaborator: publicData,
  };
};

export default updateCollaboratorPresets;
