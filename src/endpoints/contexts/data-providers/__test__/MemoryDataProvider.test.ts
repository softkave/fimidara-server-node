import * as faker from 'faker';
import {merge} from 'lodash';
import {IOrganization} from '../../../../definitions/organization';
import {SessionAgentType} from '../../../../definitions/system';
import {getDateString} from '../../../../utilities/dateFns';
import getNewId from '../../../../utilities/getNewId';
import {NotFoundError} from '../../../errors';
import OrganizationQueries from '../../../organizations/queries';
import {throwOrganizationNotFound} from '../../../organizations/utils';
import MemoryDataProvider from '../MemoryDataProvider';

// Using organization for the tests
function generateOrganization() {
  const org: IOrganization = {
    organizationId: getNewId(),
    createdBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    createdAt: getDateString(),
    name: faker.lorem.word(),
  };

  return org;
}

function generateOrganizations(count = 20) {
  const orgs: IOrganization[] = [];
  for (let i = 0; i < count; i++) {
    orgs.push(generateOrganization());
  }
  return orgs;
}

function insertOrganization(data: IOrganization[]) {
  const org = generateOrganization();
  data.push(org);
  return org;
}

function insertOrganizations(data: IOrganization[], count = 20) {
  const startIndex = data.length;
  for (let i = 0; i < count; i++) {
    insertOrganization(data);
  }
  return data.slice(startIndex);
}

function assertListEqual(list01: IOrganization[], list02: IOrganization[]) {
  list01.forEach((item, index) => {
    expect(item).toEqual(list02[index]);
  });
}

test('checkItemExists is true when item exists', async () => {
  const data: IOrganization[] = [];
  const org = insertOrganization(data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const exists = await provider.checkItemExists(
    OrganizationQueries.getById(org.organizationId)
  );

  expect(exists).toBeTruthy();
});

test('checkItemExists is false when item does not exist', async () => {
  const data: IOrganization[] = [];

  // Inserting data for blank tests so that we can know
  // definitely that it's returning blank because the filter matches nothing
  // and not because there's no data
  await insertOrganization(data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const exists = await provider.checkItemExists(
    OrganizationQueries.getById(getNewId())
  );

  expect(exists).toBeFalsy();
});

test('getItem when item exists', async () => {
  const data: IOrganization[] = [];
  const org = insertOrganization(data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const result = await provider.getItem(
    OrganizationQueries.getById(org.organizationId)
  );

  expect(result).toBe(org);
});

test('getItem when does not item exists', async () => {
  const data: IOrganization[] = [];
  await insertOrganization(data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const result = await provider.getItem(
    OrganizationQueries.getById(getNewId())
  );

  expect(result).toBeFalsy();
});

test('getManyItems returns items', async () => {
  const data: IOrganization[] = [];
  const org01 = insertOrganization(data);
  const org02 = insertOrganization(data);
  const org03 = insertOrganization(data);
  const org04 = insertOrganization(data);
  const org05 = insertOrganization(data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const result = await provider.getItem(
    OrganizationQueries.getByIds([
      org01.organizationId,
      org02.organizationId,
      org03.organizationId,
      org04.organizationId,
      org05.organizationId,
    ])
  );

  expect(result).toContain(org01);
  expect(result).toContain(org02);
  expect(result).toContain(org03);
  expect(result).toContain(org04);
  expect(result).toContain(org05);
});

test('getManyItems returns nothing', async () => {
  const data: IOrganization[] = [];
  insertOrganizations(data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const result = await provider.getItem(
    OrganizationQueries.getByIds([getNewId(), getNewId()])
  );

  expect(result).toHaveLength(0);
});

test('deleteItem deleted correct items', async () => {
  const data: IOrganization[] = [];
  const [org01] = insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  await provider.deleteItem(OrganizationQueries.getById(org01.organizationId));

  expect(data).toHaveLength(9);
  expect(
    await provider.checkItemExists(
      OrganizationQueries.getById(org01.organizationId)
    )
  ).toBeFalsy();
});

test('deleteItem deleted nothing', async () => {
  const data: IOrganization[] = [];
  insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  await provider.deleteItem(
    OrganizationQueries.getByIds([getNewId(), getNewId()])
  );

  expect(data).toHaveLength(10);
});

test('updateItem correct item', async () => {
  const data: IOrganization[] = [];
  const [org01] = insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
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
    OrganizationQueries.getById(org01.organizationId),
    orgUpdate
  );

  const updatedOrg = await provider.assertGetItem(
    OrganizationQueries.getById(org01.organizationId)
  );

  expect(result).toBe(updatedOrg);
  expect(updatedOrg).toMatchObject(orgUpdate);
});

test('updateItem update nothing', async () => {
  const data: IOrganization[] = [];
  const [org01] = insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const result = await provider.updateItem(
    OrganizationQueries.getById(org01.organizationId),
    {}
  );

  expect(result).toBeFalsy();
});

test('updateManyItems updated correct items', async () => {
  const data: IOrganization[] = [];
  const [org01, org02] = insertOrganizations(data, 10);
  const data02 = merge([], data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
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
    OrganizationQueries.getByIds([org01.organizationId, org02.organizationId]),
    orgUpdate
  );

  const updatedOrgs = await provider.getManyItems(
    OrganizationQueries.getByIds([org01.organizationId, org02.organizationId])
  );

  expect(result).toEqual(updatedOrgs);
  expect(updatedOrgs[0]).toMatchObject(orgUpdate);
  expect(updatedOrgs[1]).toMatchObject(orgUpdate);
  assertListEqual(data.slice(2), data02.slice(2));
});

test('assertUpdateItem throws when item not found', async () => {
  const data: IOrganization[] = [];
  insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);

  try {
    await provider.updateItem(OrganizationQueries.getById(getNewId()), {});
  } catch (error) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});

test('deleteManyItems', async () => {
  const data: IOrganization[] = [];
  const [org01, org02] = insertOrganizations(data, 10);
  const data02 = merge([], data);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  await provider.deleteManyItems(
    OrganizationQueries.getByIds([org01.organizationId, org02.organizationId])
  );

  expect(data.length).toEqual(8);
  assertListEqual(data, data02.slice(2));
});

test('assertItemExists', async () => {
  const data: IOrganization[] = [];
  insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);

  try {
    await provider.assertItemExists(OrganizationQueries.getById(getNewId()));
  } catch (error) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});

test('assertGetItem', async () => {
  const data: IOrganization[] = [];
  insertOrganizations(data, 10);
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);

  try {
    await provider.assertGetItem(OrganizationQueries.getById(getNewId()));
  } catch (error) {
    expect(error instanceof NotFoundError).toBeTruthy();
  }
});

test('saveItem', async () => {
  const data: IOrganization[] = [];
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const org = generateOrganization();
  await provider.saveItem(org);
  expect(data.length).toHaveLength(1);
});

test('bulkSaveItems', async () => {
  const data: IOrganization[] = [];
  const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
  const orgs = generateOrganizations(10);
  await provider.bulkSaveItems(orgs);
  expect(data.length).toHaveLength(10);
});
