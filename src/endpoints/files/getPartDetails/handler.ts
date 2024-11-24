import {makeExtract, makeListExtract} from 'softkave-js-utils';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getFields} from '../../../utils/extract.js';
import {validate} from '../../../utils/validate.js';
import {applyDefaultEndpointPaginationOptions} from '../../pagination.js';
import {getAndCheckFileAuthorization} from '../utils.js';
import {getPartMetas} from '../utils/partMeta.js';
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
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const file = await kSemanticModels.utils().withTxn(opts =>
    getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActions.readFile,
      incrementPresignedPathUsageCount: false,
    })
  );

  const pagination = applyDefaultEndpointPaginationOptions(data);
  if (!file.partLength) {
    return {
      page: pagination.page,
      details: [],
    };
  }

  const parts = await getPartMetas({
    fileId: file.resourceId,
    fromPart: data.fromPart,
    pageSize: pagination.pageSize,
    partLength: file.partLength,
  });

  return {
    page: pagination.page,
    clientMultipartId: file.clientMultipartId || undefined,
    details: partDetailsListExtractor(parts),
  };
};

export default getPartDetails;
