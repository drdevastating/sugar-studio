const pool = require('../config/database');

const generateOrderNumber = () => {
  const prefix = 'BK';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

const orderController = {
  // Get all orders
  getAllOrders: async (req, res) => {
    try {
      const { status, customer_id, limit, offset, date_from, date_to } = req.query;
      
      let query = `
        SELECT o.*, 
               c.first_name, c.last_name, c.email, c.phone,
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (status) {
        paramCount++;
        query += ` AND o.status = $${paramCount}`;
        params.push(status);
      }
      
      if (customer_id) {
        paramCount++;
        query += ` AND o.customer_id = $${paramCount}`;
        params.push(customer_id);
      }
      
      if (date_from) {
        paramCount++;
        query += ` AND o.created_at >= $${paramCount}`;
        params.push(date_from);
      }
      
      if (date_to) {
        paramCount++;
        query += ` AND o.created_at <= $${paramCount}`;
        params.push(date_to);
      }
      
      query += ` GROUP BY o.id, c.first_name, c.last_name, c.email, c.phone
                 ORDER BY o.created_at DESC`;
      
      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));
      }
      
      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset));
      }
      
      const result = await pool.query(query, params);
      
      res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  },

  // Get single order with items
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get order details
      const orderQuery = `
        SELECT o.*, c.first_name, c.last_name, c.email, c.phone, c.address
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = $1
      `;
      
      const orderResult = await pool.query(orderQuery, [id]);
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
      }
      
      // Get order items
      const itemsQuery = `
        SELECT oi.*, p.name as product_name, p.description, p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;
      
      const itemsResult = await pool.query(itemsQuery, [id]);
      
      const order = orderResult.rows[0];
      order.items = itemsResult.rows;
      
      res.json({
        status: 'success',
        data: order
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch order',
        error: error.message
      });
    }
  },

  // Create new order
  createOrder: async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        customer_id, items, order_type, scheduled_time,
        delivery_address, notes, payment_method
      } = req.body;
      
      if (!items || items.length === 0) {
        throw new Error('Order must contain at least one item');
      }
      
      // Calculate total amount
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const productQuery = 'SELECT * FROM products WHERE id = $1';
        const productResult = await client.query(productQuery, [item.product_id]);
        
        if (productResult.rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        
        const product = productResult.rows[0];
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal,
          special_instructions: item.special_instructions || null
        });
        
        // Update stock
        await client.query(
          'UPDATE products SET stock_quantity = GREATEST(stock_quantity - $1, 0) WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
      
      // Create order
      const orderNumber = generateOrderNumber();
      
      const orderQuery = `
        INSERT INTO orders 
        (customer_id, order_number, total_amount, order_type, scheduled_time, 
         delivery_address, notes, payment_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const orderValues = [
        customer_id, orderNumber, totalAmount, order_type || 'pickup',
        scheduled_time, delivery_address, notes, payment_method
      ];
      
      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];
      
      // Create order items
      for (const item of orderItems) {
        const itemQuery = `
          INSERT INTO order_items 
          (order_id, product_id, quantity, unit_price, subtotal, special_instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(itemQuery, [
          order.id, item.product_id, item.quantity,
          item.unit_price, item.subtotal, item.special_instructions
        ]);
      }
      
      await client.query('COMMIT');
      
      // Fetch complete order with items
      const completeOrder = await orderController.getOrderById(
        { params: { id: order.id } },
        { json: (data) => data }
      );
      
      res.status(201).json({
        status: 'success',
        message: 'Order created successfully',
        data: order
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({
        status: 'error',
        message: 'Failed to create order',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status'
        });
      }
      
      const query = `
        UPDATE orders 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
      }
      
      res.json({
        status: 'success',
        message: 'Order status updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update order status',
        error: error.message
      });
    }
  },

  // Cancel order
  cancelOrder: async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      
      // Get order details
      const orderQuery = 'SELECT * FROM orders WHERE id = $1';
      const orderResult = await client.query(orderQuery, [id]);
      
      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }
      
      const order = orderResult.rows[0];
      
      if (order.status === 'delivered' || order.status === 'cancelled') {
        throw new Error('Cannot cancel order with current status');
      }
      
      // Restore stock quantities
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
      const itemsResult = await client.query(itemsQuery, [id]);
      
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
      
      // Update order status
      await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', id]
      );
      
      await client.query('COMMIT');
      
      res.json({
        status: 'success',
        message: 'Order cancelled successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({
        status: 'error',
        message: 'Failed to cancel order',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Get order statistics
  getOrderStats: async (req, res) => {
    try {
      const { date_from, date_to } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (date_from && date_to) {
        dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
        params.push(date_from, date_to);
      }
      
      const statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_order_value,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders
        ${dateFilter}
      `;
      
      const result = await pool.query(statsQuery, params);
      
      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch order statistics',
        error: error.message
      });
    }
  }
};

module.exports = orderController;