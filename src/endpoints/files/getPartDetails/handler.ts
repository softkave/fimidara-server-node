import {makeExtract, makeListExtract} from 'softkave-js-utils';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getFields} from '../../../utils/extract.js';
import {validate} from '../../../utils/validate.js';
import {applyDefaultEndpointPaginationOptions} from '../../pagination.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {GetPartDetailsEndpoint, PublicPartDetails} from './types.js';
import {getPartDetailsJoiSchema} from './validation.js';

const extractPartDetailFields = getFields<PublicPartDetails>({
  part: true,
  size: true,
});

export const partDetailsExtractor = makeExtract(extractPartDetailFields);
export const partDetailsListExtractor = makeListExtract(
  extractPartDetailFields
);

const getPartDetails: GetPartDetailsEndpoint = async reqData => {
  const data = validate(reqData.data, getPartDetailsJoiSchema);
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
    return {details: [], page: 1};
  }

  applyDefaultEndpointPaginationOptions(data);
  const parts = await kIjxSemantic.filePart().getManyByFileId(file.resourceId, {
    pageSize: data.pageSize,
    page: data.page,
  });

  return {
    page: data.page!,
    clientMultipartId: file.clientMultipartId || undefined,
    details: partDetailsListExtractor(parts),
  };
};

export default getPartDetails;
