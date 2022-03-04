import assert = require('assert');
import * as faker from 'faker';
import {sortBy} from 'lodash';
import {Connection, Model} from 'mongoose';
import {getMongoConnection} from '../../../../db/connection';
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
import {
  organizationExtractor,
  organizationListExtractor,
  throwOrganizationNotFound,
} from '../../../organizations/utils';
import {
  generateOrganization,
  generateOrganizations,
} from '../../../test-utils/generate-data/organization';
import {getTestVars} from '../../../test-utils/vars';
import MongoDataProvider from '../MongoDataProvider';

// Using organization for the tests

let connection: Connection | null = null;

beforeAll(async () => {
  const testVars = getTestVars();
  connection = await getMongoConnection(
    testVars.mongoDbURI,
    testVars.mongoDbDatabaseName
  );
});

afterAll(async () => {
  assert(connection);
  const orgModel = getOrganizationModel(connection);
  await orgModel.deleteMany({}).exec();
  await connection.close();
});

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
  if (!connection) {
    throw new Error('Mongo connection not established');
  }

  const orgModel = getOrganizationModel(connection);
  const provider = new MongoDataProvider(orgModel, throwOrganizationNotFound);
  return {provider, orgModel};
}

async function getMatchedOrgsCount(
  orgModel: Model<IOrganizationDocument>,
  orgs: IOrganization[]
) {
  return await orgModel
    .countDocuments({
      resourceId: {$in: orgs.map(item => item.resourceId)},
    })
    .exec();
}

describe('MongoDataProvider', () => {
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

    assert(result);
    expect(org).toMatchObject(organizationExtractor(result));
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
    const result = await provider.getManyItems(
      OrganizationQueries.getByIds([
        org01.resourceId,
        org02.resourceId,
        org03.resourceId,
        org04.resourceId,
        org05.resourceId,
      ])
    );

    const s1 = sortBy(organizationListExtractor(result), ['resourceId']);
    const s2 = sortBy([org01, org02, org03, org04, org05], ['resourceId']);
    expect(result).toHaveLength(5);
    expect(s1[0]).toMatchObject(s2[0]);
    expect(s1[1]).toMatchObject(s2[1]);
    expect(s1[2]).toMatchObject(s2[2]);
    expect(s1[3]).toMatchObject(s2[3]);
    expect(s1[4]).toMatchObject(s2[4]);
  });

  test('getManyItems returns nothing', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    await insertOrganizationsMongo(orgModel);
    const result = await provider.getManyItems(
      OrganizationQueries.getByIds([getNewId(), getNewId()])
    );

    expect(result).toHaveLength(0);
  });

  test('deleteItem deleted correct items', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    const [org01, ...orgs] = await insertOrganizationsMongo(orgModel, 10);
    await provider.deleteItem(OrganizationQueries.getById(org01.resourceId));

    expect(await getMatchedOrgsCount(orgModel, orgs)).toBe(9);
    expect(
      await provider.checkItemExists(
        OrganizationQueries.getById(org01.resourceId)
      )
    ).toBeFalsy();
  });

  test('deleteItem deleted nothing', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    const orgs = await insertOrganizationsMongo(orgModel, 10);
    await provider.deleteItem(
      OrganizationQueries.getByIds([getNewId(), getNewId()])
    );

    expect(await getMatchedOrgsCount(orgModel, orgs)).toBe(10);
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
    expect(organizationExtractor(updatedOrg)).toMatchObject(orgUpdate);
  });

  test('updateItem update nothing', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    await insertOrganizationsMongo(orgModel, 10);
    const result = await provider.updateItem(
      OrganizationQueries.getById('009'),
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

    await provider.updateManyItems(
      OrganizationQueries.getByIds([org01.resourceId, org02.resourceId]),
      orgUpdate
    );

    const updatedOrgs = await provider.getManyItems(
      OrganizationQueries.getByIds([org01.resourceId, org02.resourceId])
    );

    expect(organizationExtractor(updatedOrgs[0])).toMatchObject(orgUpdate);
    expect(organizationExtractor(updatedOrgs[1])).toMatchObject(orgUpdate);
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
    const [org01, org02, ...orgs] = await insertOrganizationsMongo(
      orgModel,
      10
    );
    await provider.deleteManyItems(
      OrganizationQueries.getByIds([org01.resourceId, org02.resourceId])
    );

    expect(await getMatchedOrgsCount(orgModel, orgs)).toBe(8);
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
    expect(await getMatchedOrgsCount(orgModel, [org])).toBe(1);
  });

  test('bulkSaveItems', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    const orgs = generateOrganizations(10);
    await provider.bulkSaveItems(orgs);
    expect(await getMatchedOrgsCount(orgModel, orgs)).toBe(10);
  });

  test('deleteAll', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    await insertOrganizationsMongo(orgModel, 10);
    await provider.deleteAll();
    expect(await orgModel.estimatedDocumentCount()).toBe(0);
  });

  test('getAll', async () => {
    const {provider, orgModel} = await getOrgMongoProviderForTest();
    await insertOrganizationsMongo(orgModel, 10);
    const orgs = await provider.getAll();
    expect(orgs.length).toBe(10);
  });
});
