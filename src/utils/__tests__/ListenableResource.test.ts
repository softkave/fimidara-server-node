import {ListenableResource} from '../ListenableResource';

describe('ListenableResource', () => {
  test('run', async () => {
    const store = new ListenableResource<string>();
    const data01 = 'data01';
    const data02 = 'data02';

    const fn01 = jest.fn().mockImplementation((data: string) => {
      expect(data).toBe(data01);
    });
    const fn02 = jest.fn().mockImplementation((data: string) => {
      expect(data).toBe(data01);
    });

    store.listen(fn01);
    store.listen(fn02);
    store.set(data01);
    expect(store.get()).toBe(data01);
    expect(fn01).toHaveBeenCalledWith(data01);
    expect(fn02).toHaveBeenCalledWith(data01);

    store.removeListener(fn01);
    store.removeListener(fn02);
    store.set(data02);
    expect(store.get()).toBe(data02);
    expect(fn01).toHaveBeenCalledTimes(1);
    expect(fn02).toHaveBeenCalledTimes(1);
  });
});
