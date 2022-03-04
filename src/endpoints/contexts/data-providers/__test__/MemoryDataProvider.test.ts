import * as faker from 'faker';
import {merge} from 'lodash';
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
import MemoryDataProvider from '../MemoryDataProvider';

// Using organization for the tests
function insertOrganizationMemory(data: IOrganization[], org?: IOrganization) {
  org = org || generateOrganization();
  data.push(org);
  return org;
}

function insertOrganizationsMemory(
  data: IOrganization[],
  count = 20,
  orgs: IOrganization[] = []
) {
  const startIndex = data.length;
  for (let i = 0; i < count; i++) {
    insertOrganizationMemory(data, orgs[i]);
  }
  return data.slice(startIndex);
}

function assertListEqual(list01: IOrganization[], list02: IOrganization[]) {
  list01.forEach((item, index) => {
    expect(item).toEqual(list02[index]);
  });
}

describe('MemoryDataProvider', () => {
  test('checkItemExists is true when item exists', async () => {
    const data: IOrganization[] = [];
    const org = insertOrganizationMemory(data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const exists = await provider.checkItemExists(
      OrganizationQueries.getById(org.resourceId)
    );

    expect(exists).toBeTruthy();
  });

  test('checkItemExists is false when item does not exist', async () => {
    const data: IOrganization[] = [];

    // Inserting data for blank tests so that we can know
    // definitely that it's returning blank because the filter matches nothing
    // and not because there's no data
    await insertOrganizationMemory(data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const exists = await provider.checkItemExists(
      OrganizationQueries.getById(getNewId())
    );

    expect(exists).toBeFalsy();
  });

  test('getItem when item exists', async () => {
    const data: IOrganization[] = [];
    const org = insertOrganizationMemory(data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const result = await provider.getItem(
      OrganizationQueries.getById(org.resourceId)
    );

    expect(result).toEqual(org);
  });

  test('getItem when does not item exists', async () => {
    const data: IOrganization[] = [];
    await insertOrganizationMemory(data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const result = await provider.getItem(
      OrganizationQueries.getById(getNewId())
    );

    expect(result).toBeFalsy();
  });

  test('getManyItems returns items', async () => {
    const data: IOrganization[] = [];
    const org01 = insertOrganizationMemory(data);
    const org02 = insertOrganizationMemory(data);
    const org03 = insertOrganizationMemory(data);
    const org04 = insertOrganizationMemory(data);
    const org05 = insertOrganizationMemory(data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const result = await provider.getManyItems(
      OrganizationQueries.getByIds([
        org01.resourceId,
        org02.resourceId,
        org03.resourceId,
        org04.resourceId,
        org05.resourceId,
      ])
    );

    expect(result).toContainEqual(org01);
    expect(result).toContainEqual(org02);
    expect(result).toContainEqual(org03);
    expect(result).toContainEqual(org04);
    expect(result).toContainEqual(org05);
  });

  test('getManyItems returns nothing', async () => {
    const data: IOrganization[] = [];
    insertOrganizationsMemory(data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const result = await provider.getManyItems(
      OrganizationQueries.getByIds([getNewId(), getNewId()])
    );

    expect(result).toHaveLength(0);
  });

  test('deleteItem deleted correct items', async () => {
    const data: IOrganization[] = [];
    const [org01] = insertOrganizationsMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    await provider.deleteItem(OrganizationQueries.getById(org01.resourceId));

    expect(provider.items).toHaveLength(9);
    expect(
      await provider.checkItemExists(
        OrganizationQueries.getById(org01.resourceId)
      )
    ).toBeFalsy();
  });

  test('deleteItem deleted nothing', async () => {
    const data: IOrganization[] = [];
    insertOrganizationsMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    await provider.deleteItem(OrganizationQueries.getByIds(['001', '002']));

    expect(provider.items).toHaveLength(10);
  });

  test('updateItem correct item', async () => {
    const data: IOrganization[] = [];
    const [org01] = insertOrganizationsMemory(data, 10);
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
    const data: IOrganization[] = [];
    insertOrganizationsMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const result = await provider.updateItem(
      OrganizationQueries.getById('007'),
      {}
    );

    expect(result).toBeFalsy();
  });

  test('updateManyItems updated correct items', async () => {
    const data: IOrganization[] = [];
    const [org01, org02] = insertOrganizationsMemory(data, 10);
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

    await provider.updateManyItems(
      OrganizationQueries.getByIds([org01.resourceId, org02.resourceId]),
      orgUpdate
    );

    const updatedOrgs = await provider.getManyItems(
      OrganizationQueries.getByIds([org01.resourceId, org02.resourceId])
    );

    expect(updatedOrgs[0]).toMatchObject(orgUpdate);
    expect(updatedOrgs[1]).toMatchObject(orgUpdate);
    assertListEqual(provider.items.slice(2), data02.slice(2));
  });

  test('assertUpdateItem throws when item not found', async () => {
    const data: IOrganization[] = [];
    insertOrganizationsMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);

    try {
      await provider.updateItem(OrganizationQueries.getById(getNewId()), {});
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('deleteManyItems', async () => {
    const data: IOrganization[] = [];
    const [org01, org02] = insertOrganizationsMemory(data, 10);
    const data02 = merge([], data);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    await provider.deleteManyItems(
      OrganizationQueries.getByIds([org01.resourceId, org02.resourceId])
    );

    expect(provider.items.length).toEqual(8);
    assertListEqual(provider.items, data02.slice(2));
  });

  test('assertItemExists', async () => {
    const data: IOrganization[] = [];
    insertOrganizationsMemory(data, 10);
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);

    try {
      await provider.assertItemExists(OrganizationQueries.getById(getNewId()));
    } catch (error) {
      expect(error instanceof NotFoundError).toBeTruthy();
    }
  });

  test('assertGetItem', async () => {
    const data: IOrganization[] = [];
    insertOrganizationsMemory(data, 10);
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
    expect(provider.items).toHaveLength(1);
  });

  test('bulkSaveItems', async () => {
    const data: IOrganization[] = [];
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    const orgs = generateOrganizations(10);
    await provider.bulkSaveItems(orgs);
    expect(provider.items).toHaveLength(10);
  });

  test('deleteAll', async () => {
    const data: IOrganization[] = [];
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    insertOrganizationsMemory(data, 10);
    await provider.deleteAll();
    expect(provider.items).toHaveLength(0);
  });

  test('getAll', async () => {
    const data: IOrganization[] = [];
    const provider = new MemoryDataProvider(data, throwOrganizationNotFound);
    insertOrganizationsMemory(data, 10);
    const everyOrg = await provider.getAll();
    expect(everyOrg.length).toBe(10);
  });
});
