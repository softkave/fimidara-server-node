import {IProgramAccessToken} from '../../../definitions/programAccessToken';

import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {ProgramAccessTokenUtils} from '../utils';
import {AddProgramAccessTokenEndpoint} from './types';
import {addProgramAccessTokenJoiSchema} from './validation';

const addProgramAccessToken: AddProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addProgramAccessTokenJoiSchema);
  const user = await context.session.getUser(context, instData);
  const token: IProgramAccessToken = await context.data.programAccessToken.saveItem(
    {
      ...data,
      tokenId: getNewId(),
      hash: '',
      createdAt: getDateString(),
      createdBy: user.userId,
    }
  );

  return {
    token: ProgramAccessTokenUtils.extractPublicToken(token),
  };
};

export default addProgramAccessToken;
