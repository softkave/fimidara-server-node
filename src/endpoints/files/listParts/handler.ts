import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {applyDefaultEndpointPaginationOptions} from '../../pagination.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {partDetailsListExtractor} from '../utils/extractPublicPart.js';
import {ListPartsEndpoint} from './types.js';
import {listPartsJoiSchema} from './validation.js';

const listParts: ListPartsEndpoint = async reqData => {
  const data = validate(reqData.data, listPartsJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kIjxSemantic.utils().withTxn(opts =>
    getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActions.readFile,
      incrementPresignedPathUsageCount: false,
    })
  );

  if (!file.internalMultipartId) {
    return {parts: [], page: 1};
  }

  applyDefaultEndpointPaginationOptions(data);
  const parts = await kIjxSemantic.filePart().getManyByFileId(file.resourceId, {
    pageSize: data.pageSize,
    page: data.page,
  });

  return {
    page: data.page!,
    clientMultipartId: file.clientMultipartId || undefined,
    parts: partDetailsListExtractor(parts),
  };
};

export default listParts;
