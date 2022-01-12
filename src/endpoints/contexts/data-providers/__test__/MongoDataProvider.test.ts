import * as faker from 'faker';
import {Model} from 'mongoose';
import {
  getOrganizationModel,
  IOrganizationDocument,
} from '../../../../db/organization';
import {IOrganization} from '../../../../definitions/organization';
import {SessionAgentType} from '../../../../definitions/system';
import {getDateString} from '../../../../utilities/dateFns';
import getNewId from '../../../../utilities/getNewId';
import {NotFoundError} from '../../../errors';
import OrganizationQueries from '../../../organizations/queries';
import {throwOrganizationNotFound} from '../../../organizations/utils';
import {
  generateOrganization,
  generateOrganizations,
} from '../../../test-utils/generate-data/organization';
import {getTestMongoConnection} from '../../../test-utils/mongo';
import MongoDataProvider from '../MongoDataProvider';

// Using organization for the tests

async function insertOrganizationMongo(
  orgModel: Model<IOrganizationDocument>,
  org?: IOrganization
) {
  org = org || generateOrganization();
  const doc = new orgModel(org);
  await doc.save();
  return org;
}

async function insertOrganizationsMongo(
  orgModel: Model<IOrganizationDocument>,
  count = 20,
  orgs?: IOrganization[]
) {
  orgs = orgs || generateOrganizations(count);
  await orgModel.insertMany(orgs);
  return orgs;
}

export async function getOrgMongoProviderForTest() {
  const connection = await getTestMongoConnection();
  const orgModel = getOrganizationModel(connection);
  const provider = new MongoDataProvider(orgModel, throwOrganizationNotFound);
  return {provider, orgModel};
}

test('checkItemExists is true when item exists', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const org = await insertOrganizationMongo(orgModel);
  const exists = await provider.checkItemExists(
    OrganizationQueries.getById(org.resourceId)
  );

  expect(exists).toBeTruthy();
});

test('checkItemExists is false when item does not exist', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();

  // Inserting data for blank tests so that we can know
  // definitely that it's returning blank because the filter matches nothing
  // and not because there's no data
  await insertOrganizationMongo(orgModel);
  const exists = await provider.checkItemExists(
    OrganizationQueries.getById(getNewId())
  );

  expect(exists).toBeFalsy();
});

test('getItem when item exists', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const org = await insertOrganizationMongo(orgModel);
  const result = await provider.getItem(
    OrganizationQueries.getById(org.resourceId)
  );

  expect(result).toEqual(org);
});

test('getItem when does not item exists', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  await insertOrganizationMongo(orgModel);
  const result = await provider.getItem(
    OrganizationQueries.getById(getNewId())
  );

  expect(result).toBeFalsy();
});

test('getManyItems returns items', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const org01 = await insertOrganizationMongo(orgModel);
  const org02 = await insertOrganizationMongo(orgModel);
  const org03 = await insertOrganizationMongo(orgModel);
  const org04 = await insertOrganizationMongo(orgModel);
  const org05 = await insertOrganizationMongo(orgModel);
  const result = await provider.getItem(
    OrganizationQueries.getByIds([
      org01.resourceId,
      org02.resourceId,
      org03.resourceId,
      org04.resourceId,
      org05.resourceId,
    ])
  );

  expect(result).toContain(org01);
  expect(result).toContain(org02);
  expect(result).toContain(org03);
  expect(result).toContain(org04);
  expect(result).toContain(org05);
});

test('getManyItems returns nothing', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  await insertOrganizationsMongo(orgModel);
  const result = await provider.getItem(
    OrganizationQueries.getByIds([getNewId(), getNewId()])
  );

  expect(result).toHaveLength(0);
});

test('deleteItem deleted correct items', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const [org01] = await insertOrganizationsMongo(orgModel, 10);
  await provider.deleteItem(OrganizationQueries.getById(org01.resourceId));

  expect(await orgModel.estimatedDocumentCount()).toHaveLength(9);
  expect(
    await provider.checkItemExists(
      OrganizationQueries.getById(org01.resourceId)
    )
  ).toBeFalsy();
});

test('deleteItem deleted nothing', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  await insertOrganizationsMongo(orgModel, 10);
  await provider.deleteItem(
    OrganizationQueries.getByIds([getNewId(), getNewId()])
  );

  expect(await orgModel.estimatedDocumentCount()).toHaveLength(10);
});

test('updateItem correct item', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const [org01] = await insertOrganizationsMongo(orgModel, 10);
  const orgUpdate: Partial<IOrganization> = {
    lastUpdatedBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    lastUpdatedAt: getDateString(),
    name: faker.lorem.word(),
    description: faker.lorem.paragraph(),
  };

  const result = await provider.updateItem(
    OrganizationQueries.getById(org01.resourceId),
    orgUpdate
  );

  const updatedOrg = await provider.assertGetItem(
    OrganizationQueries.getById(org01.resourceId)
  );

  expect(result).toEqual(updatedOrg);
  expect(updatedOrg).toMatchObject(orgUpdate);
});

test('updateItem update nothing', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const [org01] = await insertOrganizationsMongo(orgModel, 10);
  const result = await provider.updateItem(
    OrganizationQueries.getById(org01.resourceId),
    {}
  );

  expect(result).toBeFalsy();
});

test('updateManyItems updated correct items', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const [org01, org02] = await insertOrganizationsMongo(orgModel, 10);
  const orgUpdate: Partial<IOrganization> = {
    lastUpdatedBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    lastUpdatedAt: getDateString(),
    name: faker.lorem.word(),
    description: faker.lorem.paragraph(),
  };

  const result = await provider.updateItem(
    OrganizationQueries.getByIds([org01.resourceId, org02.resourceId]),
    orgUpdate
  );

  const updatedOrgs = await provider.getManyItems(
    OrganizationQueries.getByIds([org01.resourceId, org02.resourceId])
  );

  expect(result).toEqual(updatedOrgs);
  expect(updatedOrgs[0]).toMatchObject(orgUpdate);
  expect(updatedOrgs[1]).toMatchObject(orgUpdate);
});

test('assertUpdateItem throws when item not found', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  await insertOrganizationsMongo(orgModel, 10);

  try {
    await provider.updateItem(OrganizationQueries.getById(getNewId()), {});
  } catch (error) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});

test('deleteManyItems', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const [org01, org02] = await insertOrganizationsMongo(orgModel, 10);
  await provider.deleteManyItems(
    OrganizationQueries.getByIds([org01.resourceId, org02.resourceId])
  );

  expect(await orgModel.estimatedDocumentCount()).toHaveLength(8);
});

test('assertItemExists', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  await insertOrganizationsMongo(orgModel, 10);

  try {
    await provider.assertItemExists(OrganizationQueries.getById(getNewId()));
  } catch (error) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});

test('assertGetItem', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  await insertOrganizationsMongo(orgModel, 10);

  try {
    await provider.assertGetItem(OrganizationQueries.getById(getNewId()));
  } catch (error) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});

test('saveItem', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const org = generateOrganization();
  await provider.saveItem(org);
  expect(await orgModel.estimatedDocumentCount()).toHaveLength(1);
});

test('bulkSaveItems', async () => {
  const {provider, orgModel} = await getOrgMongoProviderForTest();
  const orgs = generateOrganizations(10);
  await provider.bulkSaveItems(orgs);
  expect(await orgModel.estimatedDocumentCount()).toHaveLength(10);
});