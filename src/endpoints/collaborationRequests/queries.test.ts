import {Model} from 'mongoose';
import * as faker from 'faker';
import MemoryDataProvider from '../contexts/data-providers/MemoryDataProvider';
import MongoDataProvider from '../contexts/data-providers/MongoDataProvider';
import {getTestMongoConnection} from '../test-utils/mongo';
import {
  getCollaborationRequestModel,
  ICollaborationRequestDocument,
} from '../../db/collaborationRequest';
import {throwCollaborationRequestNotFound} from './utils';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {generateCollaborationRequestListForTest} from '../test-utils/generate-data/collaborationRequest';
import CollaborationRequestQueries from './queries';
import getNewId from '../../utilities/getNewId';

async function getProviders() {
  const connection = await getTestMongoConnection();
  const model = getCollaborationRequestModel(connection);
  const mongoProvider = new MongoDataProvider(
    model,
    throwCollaborationRequestNotFound
  );

  const memoryData: ICollaborationRequest[] = [];
  const memoryProvider = new MemoryDataProvider(
    memoryData,
    throwCollaborationRequestNotFound
  );

  return {model, mongoProvider, memoryProvider, memoryData};
}

async function insertRequests(
  model: Model<ICollaborationRequestDocument>,
  data: ICollaborationRequest[],
  count = 20,
  requests: ICollaborationRequest[] = []
) {
  data = data || generateCollaborationRequestListForTest(count);
  await model.insertMany(data);

  const startIndex = data.length;
  for (let i = 0; i < count; i++) {
    data.push(requests[i]);
  }
  return data.slice(startIndex);
}

test('getByUserEmail', async () => {
  const {
    mongoProvider,
    memoryProvider,
    memoryData,
    model,
  } = await getProviders();
  const [request01] = await insertRequests(model, memoryData, 5);
  const mongoRequest01 = await mongoProvider.assertGetItem(
    CollaborationRequestQueries.getByUserEmail(request01.recipientEmail)
  );

  const memoryRequest01 = await memoryProvider.assertGetItem(
    CollaborationRequestQueries.getByUserEmail(request01.recipientEmail)
  );

  expect(mongoRequest01).toEqual(memoryRequest01);
  expect(mongoRequest01).toEqual(request01);
});

test('getByOrganizationIdAndUserEmail', async () => {
  const {
    mongoProvider,
    memoryProvider,
    memoryData,
    model,
  } = await getProviders();
  const orgId = getNewId();
  const email = faker.internet.email();
  const requestList01 = generateCollaborationRequestListForTest(10, () => ({
    organizationId: orgId,
    recipientEmail: email,
  }));

  const requestList02 = generateCollaborationRequestListForTest(10);
  const requests = requestList01.concat(requestList02);
  await insertRequests(model, memoryData, requests.length, requests);

  const mongoRequests01 = await mongoProvider.getManyItems(
    CollaborationRequestQueries.getByOrganizationIdAndUserEmail(orgId, email)
  );

  const memoryRequests01 = await memoryProvider.getManyItems(
    CollaborationRequestQueries.getByOrganizationIdAndUserEmail(orgId, email)
  );

  expect(mongoRequests01).toEqual(memoryRequests01);
  expect(mongoRequests01).toEqual(requestList01);
});
