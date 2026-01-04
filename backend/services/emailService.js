// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
    }
  });
};

// Send order confirmation to customer
const sendOrderConfirmation = async (order, customer) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"The Sugar Studio" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `Order Confirmation - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #db2777); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Thank you for your order, ${customer.first_name}!</h2>
          <p style="color: #6b7280; font-size: 16px;">
            Your order has been received and is being prepared with love at The Sugar Studio.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #ec4899; margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Total Amount:</strong> ₹${order.total_amount}</p>
            <p><strong>Order Type:</strong> ${order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
            ${order.scheduled_time ? `<p><strong>Scheduled For:</strong> ${new Date(order.scheduled_time).toLocaleString()}</p>` : ''}
            ${order.delivery_address ? `<p><strong>Delivery Address:</strong> ${order.delivery_address}</p>` : ''}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #ec4899; margin-top: 0;">Order Items</h3>
            ${order.items.map(item => `
              <div style="border-bottom: 1px solid #f3f4f6; padding: 10px 0;">
                <p style="margin: 5px 0;"><strong>${item.product_name}</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">Quantity: ${item.quantity} × ₹${item.unit_price} = ₹${item.subtotal}</p>
                ${item.special_instructions ? `<p style="margin: 5px 0; font-style: italic; color: #6b7280;">Note: ${item.special_instructions}</p>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 10px; border-left: 4px solid #ec4899;">
            <p style="margin: 0; color: #374151;">
              <strong>Track your order:</strong> Visit our website and use order number <strong>${order.order_number}</strong> to track your order status.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Questions? Contact us at info@thesugarstudio.com or call (555) 123-CAKE
          </p>
        </div>
        
        <div style="background: #374151; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            © 2024 The Sugar Studio. Made with ❤️ and lots of sugar!
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent to:', customer.email);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

// Send order notification to baker
const sendBakerNotification = async (order, customer) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"The Sugar Studio" <${process.env.EMAIL_USER}>`,
    to: process.env.BAKER_EMAIL || process.env.EMAIL_USER,
    subject: `🔔 New Order Received - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Order Alert! 🍰</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              ⚡ Action Required: New order received at ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #ec4899; margin-top: 0;">Order Information</h3>
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Total Amount:</strong> ₹${order.total_amount}</p>
            <p><strong>Order Type:</strong> ${order.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method || 'COD'}</p>
            ${order.scheduled_time ? `<p><strong>Scheduled For:</strong> ${new Date(order.scheduled_time).toLocaleString()}</p>` : ''}
            ${order.notes ? `<p><strong>Special Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #ec4899; margin-top: 0;">Customer Details</h3>
            <p><strong>Name:</strong> ${customer.first_name} ${customer.last_name}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            ${order.delivery_address ? `<p><strong>Delivery Address:</strong> ${order.delivery_address}</p>` : ''}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #ec4899; margin-top: 0;">Items to Prepare</h3>
            ${order.items.map(item => `
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #ec4899;">
                <p style="margin: 5px 0; font-size: 18px;"><strong>${item.product_name}</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">Quantity: <strong style="font-size: 20px; color: #ec4899;">${item.quantity}</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">Price: ₹${item.unit_price} × ${item.quantity} = ₹${item.subtotal}</p>
                ${item.special_instructions ? `<p style="margin: 10px 0 5px 0; padding: 10px; background: #fef2f2; border-radius: 5px; color: #991b1b;"><strong>⚠️ Special Instructions:</strong> ${item.special_instructions}</p>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/admin/orders/${order.id}" 
               style="background: linear-gradient(135deg, #ec4899, #db2777); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              View Order in Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Baker notification email sent');
  } catch (error) {
    console.error('Error sending baker notification email:', error);
  }
};

// Send order status update to customer
const sendOrderStatusUpdate = async (order, customer, newStatus) => {
  const transporter = createTransporter();

  const statusMessages = {
    'confirmed': {
      title: 'Order Confirmed',
      message: 'Your order has been confirmed and will be prepared soon!',
      emoji: '✅'
    },
    'preparing': {
      title: 'Order Being Prepared',
      message: 'Our bakers are working on your delicious treats!',
      emoji: '👨‍🍳'
    },
    'ready': {
      title: 'Order Ready',
      message: order.order_type === 'pickup' ? 'Your order is ready for pickup!' : 'Your order is ready for delivery!',
      emoji: '🎉'
    },
    'out_for_delivery': {
      title: 'Out for Delivery',
      message: 'Your order is on its way to you!',
      emoji: '🚚'
    },
    'delivered': {
      title: 'Order Delivered',
      message: 'Your order has been delivered. Enjoy your treats!',
      emoji: '🎊'
    },
    'cancelled': {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact us.',
      emoji: '❌'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    title: 'Order Update',
    message: `Your order status has been updated to: ${newStatus}`,
    emoji: 'ℹ️'
  };

  const mailOptions = {
    from: `"The Sugar Studio" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `${statusInfo.emoji} ${statusInfo.title} - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #06b6d4, #0891b2); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">${statusInfo.emoji} ${statusInfo.title}</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Hi ${customer.first_name}!</h2>
          <p style="color: #6b7280; font-size: 16px;">${statusInfo.message}</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Current Status:</strong> <span style="color: #10b981; font-weight: bold;">${newStatus.toUpperCase().replace('_', ' ')}</span></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/track-order/${order.order_number}" 
               style="background: linear-gradient(135deg, #ec4899, #db2777); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Track Your Order
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Questions? Contact us at info@thesugarstudio.com or call (555) 123-CAKE
          </p>
        </div>
        
        <div style="background: #374151; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 14px;">
            © 2024 The Sugar Studio. Made with ❤️ and lots of sugar!
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Status update email sent to:', customer.email);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendBakerNotification,
  sendOrderStatusUpdate
};