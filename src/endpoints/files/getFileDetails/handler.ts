import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {fileExtractor, getAndCheckFileAuthorization} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async instData => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kSemanticModels.utils().withTxn(
    opts =>
      getAndCheckFileAuthorization({
        agent,
        opts,
        matcher: data,
        action: kFimidaraPermissionActionsMap.readFile,
        incrementPresignedPathUsageCount: false,
      }),
    /** reuseTxn */ false
  );

  return {file: fileExtractor(file)};
};

export default getFileDetails;
