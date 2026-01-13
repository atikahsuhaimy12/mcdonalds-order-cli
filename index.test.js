// index.test.js - Unit Tests
const { OrderManager, Order, Bot } = require('./index');

describe('OrderManager', () => {
  let manager;

  beforeEach(() => {
    manager = new OrderManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('should create normal order', () => {
    const order = manager.addOrder(false);
    expect(order.type).toBe('NORMAL');
    expect(order.status).toBe('PENDING');
    expect(manager.orders.length).toBe(1);
  });

  test('should create VIP order', () => {
    const order = manager.addOrder(true);
    expect(order.type).toBe('VIP');
    expect(order.status).toBe('PENDING');
  });

  test('VIP orders should be placed before normal orders', () => {
    manager.addOrder(false); // Normal order #1
    manager.addOrder(false); // Normal order #2
    manager.addOrder(true);  // VIP order #3

    const pendingOrders = manager.orders.filter(o => o.status === 'PENDING');
    expect(pendingOrders[0].type).toBe('VIP');
    expect(pendingOrders[0].id).toBe(3);
    expect(pendingOrders[1].id).toBe(1);
    expect(pendingOrders[2].id).toBe(2);
  });

  test('should add bot', () => {
    manager.addBot();
    expect(manager.bots.length).toBe(1);
    expect(manager.bots[0].status).toBe('IDLE');
  });

  test('should remove bot', () => {
    manager.addBot();
    manager.removeBot();
    expect(manager.bots.length).toBe(0);
  });

  test('bot should process order', async () => {
    manager.addOrder(false);
    manager.addBot();

    const bot = manager.bots[0];
    const order = manager.orders[0];

    // Order should now be processing
    expect(order.status).toBe('PROCESSING');
    expect(bot.status).toBe('PROCESSING');

    // Fast-forward time by 10 seconds
    jest.advanceTimersByTime(10000);
    await Promise.resolve(); // Let promises resolve

    // Order should be complete
    expect(order.status).toBe('COMPLETE');
    expect(bot.status).toBe('IDLE');
  });

  test('removing bot should return order to pending', () => {
    manager.addOrder(false);
    manager.addBot();

    const order = manager.orders[0];
    expect(order.status).toBe('PROCESSING');

    manager.removeBot();
    expect(order.status).toBe('PENDING');
  });

  test('should have unique and increasing order numbers', () => {
    const order1 = manager.addOrder(false);
    const order2 = manager.addOrder(true);
    const order3 = manager.addOrder(false);

    expect(order1.id).toBe(1);
    expect(order2.id).toBe(2);
    expect(order3.id).toBe(3);
    expect(order1.id).toBeLessThan(order2.id);
    expect(order2.id).toBeLessThan(order3.id);
  });

  test('idle bot should pick up pending order', () => {
    const bot = manager.addBot();
    expect(bot.status).toBe('IDLE');

    manager.addOrder(false);
    expect(bot.status).toBe('PROCESSING');
  });

  test('should get correct status', () => {
    manager.addOrder(false);
    manager.addOrder(true);
    manager.addBot();

    const status = manager.getStatus();
    expect(status.totalOrders).toBe(2);
    expect(status.bots).toBe(1);
  });
});