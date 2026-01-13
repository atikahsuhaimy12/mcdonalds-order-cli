// index.js - Main CLI Application
const fs = require('fs');

class Order {
  constructor(id, type) {
    this.id = id;
    this.type = type; // 'VIP' or 'NORMAL'
    this.status = 'PENDING'; // 'PENDING', 'PROCESSING', 'COMPLETE'
    this.createdAt = new Date();
    this.completedAt = null;
  }
}

class Bot {
  constructor(id, orderManager) {
    this.id = id;
    this.status = 'IDLE'; // 'IDLE', 'PROCESSING'
    this.processingOrderId = null;
    this.orderManager = orderManager;
    this.timeout = null;
  }

  async processOrder(order) {
    this.status = 'PROCESSING';
    this.processingOrderId = order.id;
    order.status = 'PROCESSING';
    
    const timestamp = new Date().toTimeString().split(' ')[0];
    this.orderManager.log(`${timestamp} - Bot #${this.id} started processing Order #${order.id} (${order.type})`);

    return new Promise(resolve => {
      this.timeout = setTimeout(() => {
        order.status = 'COMPLETE';
        order.completedAt = new Date();
        const completeTime = new Date().toTimeString().split(' ')[0];
        this.orderManager.log(`${completeTime} - Bot #${this.id} completed Order #${order.id} (${order.type})`);
        
        this.status = 'IDLE';
        this.processingOrderId = null;
        this.timeout = null;
        resolve();
      }, 10000);
    });
  }

  stopProcessing() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
      
      const order = this.orderManager.orders.find(o => o.id === this.processingOrderId);
      if (order) {
        order.status = 'PENDING';
        const timestamp = new Date().toTimeString().split(' ')[0];
        this.orderManager.log(`${timestamp} - Bot #${this.id} stopped processing Order #${order.id}, returned to PENDING`);
      }
      
      this.status = 'IDLE';
      this.processingOrderId = null;
    }
  }
}

class OrderManager {
  constructor() {
    this.orders = [];
    this.bots = [];
    this.orderCounter = 1;
    this.botCounter = 1;
    this.logs = [];
  }

  log(message) {
    console.log(message);
    this.logs.push(message);
  }

  addOrder(isVIP) {
    const order = new Order(this.orderCounter++, isVIP ? 'VIP' : 'NORMAL');
    
    // Insert VIP orders before normal orders in pending queue
    const pendingOrders = this.orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING');
    const completedOrders = this.orders.filter(o => o.status === 'COMPLETE');
    
    if (isVIP) {
      const vipOrders = pendingOrders.filter(o => o.type === 'VIP' && o.status === 'PENDING');
      const normalOrders = pendingOrders.filter(o => o.type === 'NORMAL' && o.status === 'PENDING');
      const processing = pendingOrders.filter(o => o.status === 'PROCESSING');
      this.orders = [...processing, ...vipOrders, order, ...normalOrders, ...completedOrders];
    } else {
      const pending = pendingOrders.filter(o => o.status === 'PENDING');
      const processing = pendingOrders.filter(o => o.status === 'PROCESSING');
      this.orders = [...processing, ...pending, order, ...completedOrders];
    }

    const timestamp = new Date().toTimeString().split(' ')[0];
    this.log(`${timestamp} - New ${order.type} Order #${order.id} added to PENDING`);
    
    this.assignOrdersToBots();
    return order;
  }

  addBot() {
    const bot = new Bot(this.botCounter++, this);
    this.bots.push(bot);
    
    const timestamp = new Date().toTimeString().split(' ')[0];
    this.log(`${timestamp} - Bot #${bot.id} added`);
    
    this.assignOrdersToBots();
    return bot;
  }

  removeBot() {
    if (this.bots.length === 0) return;
    
    const bot = this.bots.pop();
    bot.stopProcessing();
    
    const timestamp = new Date().toTimeString().split(' ')[0];
    this.log(`${timestamp} - Bot #${bot.id} removed`);
    
    this.assignOrdersToBots();
  }

  assignOrdersToBots() {
    const idleBots = this.bots.filter(b => b.status === 'IDLE');
    const pendingOrders = this.orders.filter(o => o.status === 'PENDING');

    idleBots.forEach((bot, index) => {
      if (pendingOrders[index]) {
        bot.processOrder(pendingOrders[index]).then(() => {
          this.assignOrdersToBots();
        });
      }
    });
  }

  getStatus() {
    const pending = this.orders.filter(o => o.status === 'PENDING');
    const processing = this.orders.filter(o => o.status === 'PROCESSING');
    const completed = this.orders.filter(o => o.status === 'COMPLETE');
    
    return {
      bots: this.bots.length,
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      totalOrders: this.orders.length
    };
  }

  writeResults(filename = 'result.txt') {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const status = this.getStatus();
    
    const output = [
      '=== McDonald\'s Order Management System ===',
      `Execution Time: ${timestamp}`,
      '',
      '--- System Status ---',
      `Total Bots: ${status.bots}`,
      `Pending Orders: ${status.pending}`,
      `Processing Orders: ${status.processing}`,
      `Completed Orders: ${status.completed}`,
      `Total Orders: ${status.totalOrders}`,
      '',
      '--- Execution Log ---',
      ...this.logs,
      '',
      '--- Order Details ---',
      ...this.orders.map(o => {
        const created = o.createdAt.toTimeString().split(' ')[0];
        const completed = o.completedAt ? o.completedAt.toTimeString().split(' ')[0] : 'N/A';
        return `Order #${o.id} (${o.type}) - Status: ${o.status} | Created: ${created} | Completed: ${completed}`;
      })
    ].join('\n');

    fs.writeFileSync(filename, output);
    console.log(`\nResults written to ${filename}`);
  }
}

// Simulation function
async function runSimulation() {
  const manager = new OrderManager();
  
  console.log('=== Starting McDonald\'s Order Management Simulation ===\n');
  
  // Add some normal orders
  manager.addOrder(false);
  manager.addOrder(false);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Add a VIP order (should go to front)
  manager.addOrder(true);
  
  // Add a bot
  manager.addBot();
  
  // Wait for first order to complete
  await new Promise(resolve => setTimeout(resolve, 11000));
  
  // Add another bot
  manager.addBot();
  
  // Add more orders
  manager.addOrder(true);
  manager.addOrder(false);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 12000));
  
  // Remove a bot
  manager.removeBot();
  
  // Wait for remaining orders
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Write results
  manager.writeResults();
  
  console.log('\n=== Simulation Complete ===');
}

// Run simulation if this is the main module
if (require.main === module) {
  runSimulation().catch(console.error);
}

module.exports = { OrderManager, Order, Bot };