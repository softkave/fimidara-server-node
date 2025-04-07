import {UsageRecordCategory} from '../../definitions/usageRecord.js';
import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';

export class UsageLimitExceededError extends OperationError {
  name = 'UsageLimitExceededError';
  statusCode = kEndpointConstants.httpStatusCode.forbidden;
  reqCategory: UsageRecordCategory;
  blockingCategory: UsageRecordCategory;

  constructor(
    props: OperationErrorParameters & {
      reqCategory: UsageRecordCategory;
      blockingCategory: UsageRecordCategory;
    }
  ) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      `Usage limit exceeded for category "${props.blockingCategory}"` +
        (props.blockingCategory !== props.reqCategory
          ? ` when incrementing category "${props.reqCategory}".`
          : '.')
    );
    this.reqCategory = props.reqCategory;
    this.blockingCategory = props.blockingCategory;
  }
}
