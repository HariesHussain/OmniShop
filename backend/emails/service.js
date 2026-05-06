import {
  adminOrderNotificationTemplate,
  customerOrderConfirmationTemplate,
  deliveryAssignmentTemplate,
  orderStatusUpdateTemplate,
  sellerOrderNotificationTemplate,
} from './templates.js';

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((x) => x.trim()).filter(Boolean);
};

export const createEmailNotifier = ({ resend, fromEmail, logInfo, logError }) => {
  const safeSend = async ({ to, subject, html }) => {
    if (!resend || !fromEmail || !to) return;
    try {
      const recipients = normalizeList(to);
      if (recipients.length === 0) return;
      const { error } = await resend.emails.send({ from: fromEmail, to: recipients, subject, html });
      if (error) {
        logError('[EMAIL] Send failed:', error);
        return { ok: false, error };
      } else {
        logInfo(`[EMAIL] Sent: ${subject} -> ${recipients.join(', ')}`);
        return { ok: true };
      }
    } catch (error) {
      logError('[EMAIL] Unexpected send failure:', error);
      return { ok: false, error };
    }
  };

  const notifyOrderPlaced = async ({ order }) => {
    await safeSend({ to: order.buyer_email, ...customerOrderConfirmationTemplate({ order }) });

    const sellerMap = new Map();
    (order.items || []).forEach((item) => {
      const sellerEmail = String(item.seller_email || '').trim().toLowerCase();
      if (!sellerEmail) return;
      if (!sellerMap.has(sellerEmail)) sellerMap.set(sellerEmail, []);
      sellerMap.get(sellerEmail).push(item);
    });

    for (const [sellerEmail, sellerItems] of sellerMap.entries()) {
      await safeSend({ to: sellerEmail, ...sellerOrderNotificationTemplate({ order, sellerEmail, sellerItems }) });
    }

    if (order.assignedDeliveryBoyEmail) {
      await safeSend({
        to: order.assignedDeliveryBoyEmail,
        ...deliveryAssignmentTemplate({
          order,
          assignment: {
            delivery_boy_email: order.assignedDeliveryBoyEmail,
            delivery_boy_name: order.assignedDeliveryBoyName,
            estimated_delivery_date: order.estimatedDeliveryDate,
          },
        }),
      });
    }

    await safeSend({ to: process.env.ORDER_ALERT_ADMIN_EMAIL, ...adminOrderNotificationTemplate({ order }) });
  };

  const notifyPaymentConfirmed = async ({ order }) => {
    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      await safeSend({
        to: order.buyer_email,
        subject: `Payment received for order #${order.id}`,
        html: `<p>Your payment for order <strong>#${order.id}</strong> is confirmed.</p>`,
      });
    }
  };

  const notifyDeliveryAssigned = async ({ order, assignment }) => {
    await safeSend({
      to: assignment?.delivery_boy_email || order.assignedDeliveryBoyEmail,
      ...deliveryAssignmentTemplate({ order, assignment }),
    });
  };

  const notifyOrderStatusUpdated = async ({ order, status }) => {
    await safeSend({ to: order.buyer_email, ...orderStatusUpdateTemplate({ order, status }) });
  };

  return {
    notifyOrderPlaced,
    notifyPaymentConfirmed,
    notifyDeliveryAssigned,
    notifyOrderStatusUpdated,
    safeSend,
  };
};
