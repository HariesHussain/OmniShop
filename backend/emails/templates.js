import {
  buildSubjectPrefix,
  escapeHtml,
  formatCurrency,
  formatDateTime,
  formatShortDate,
  renderAddressBlock,
  renderEmailShell,
  renderKeyValueGrid,
  renderOrderTable,
  renderSection,
} from './layout.js';

const itemListSummary = (items = []) => items.map((item) => `${escapeHtml(item.title || 'Product')} x${Number(item.quantity || 1)}`).join(', ');

export const customerOrderConfirmationTemplate = ({ order }) => ({
  subject: buildSubjectPrefix(`Order confirmed #${order.id}`),
  html: renderEmailShell({
    title: 'Your order is confirmed',
    preheader: `Order #${order.id} has been placed successfully.`,
    body: `
      ${renderSection('Order overview', renderKeyValueGrid([
        { label: 'Order ID', value: `#${escapeHtml(order.id)}` },
        { label: 'Payment status', value: escapeHtml(order.payment_status || 'pending') },
        { label: 'Payment method', value: escapeHtml(order.payment_method || 'N/A') },
        { label: 'Estimated delivery', value: escapeHtml(formatShortDate(order.delivery_estimate)) },
      ]))}
      ${renderSection('Shipping address', renderAddressBlock(order.shipping_address || {}))}
      ${renderSection('Items', renderOrderTable(order.items || []))}
      ${renderSection('Order total', `<div style="font-size:26px;font-weight:800;color:#0f172a;">${formatCurrency(order.total_amount)}</div>`)}
    `,
  }),
});

export const deliveryAssignmentTemplate = ({ order, assignment }) => ({
  subject: buildSubjectPrefix(`New delivery assignment #${order.id}`),
  html: renderEmailShell({
    title: 'New delivery assignment',
    preheader: `You have been assigned order #${order.id}.`,
    body: `
      ${renderSection('Assignment details', renderKeyValueGrid([
        { label: 'Order ID', value: `#${escapeHtml(order.id)}` },
        { label: 'Delivery status', value: escapeHtml(assignment?.status || 'assigned') },
        { label: 'Estimated delivery', value: escapeHtml(formatDateTime(assignment?.estimated_delivery_date || order.delivery_estimate)) },
        { label: 'Payment method', value: escapeHtml(order.payment_method || 'N/A') },
      ]))}
      ${renderSection('Customer', renderKeyValueGrid([
        { label: 'Name', value: escapeHtml(order.buyer_name || assignment?.buyer_name || 'N/A') },
        { label: 'Email', value: escapeHtml(order.buyer_email || assignment?.buyer_email || 'N/A') },
        { label: 'Phone', value: escapeHtml(assignment?.buyer_phone || order.shipping_address?.phone || 'N/A') },
      ]))}
      ${renderSection('Delivery address', renderAddressBlock(order.shipping_address || { address: assignment?.delivery_address }))}
      ${renderSection('Items', renderOrderTable(order.items || []))}
    `,
  }),
});

export const sellerOrderNotificationTemplate = ({ order, sellerEmail, sellerItems }) => ({
  subject: buildSubjectPrefix(`Product ordered #${order.id}`),
  html: renderEmailShell({
    title: 'A customer ordered your product',
    preheader: `Your items were included in order #${order.id}.`,
    body: `
      ${renderSection('Seller summary', renderKeyValueGrid([
        { label: 'Seller email', value: escapeHtml(sellerEmail) },
        { label: 'Order ID', value: `#${escapeHtml(order.id)}` },
        { label: 'Buyer', value: escapeHtml(`${order.buyer_name || 'N/A'} • ${order.buyer_email || 'N/A'}`) },
        { label: 'Payment status', value: escapeHtml(order.payment_status || 'pending') },
      ]))}
      ${renderSection('Your items', renderOrderTable(sellerItems || []))}
      ${renderSection('Shipping address', renderAddressBlock(order.shipping_address || {}))}
      ${renderSection('Totals', renderKeyValueGrid([
        { label: 'Seller item count', value: String(sellerItems?.length || 0) },
        { label: 'Order total', value: formatCurrency(order.total_amount) },
      ]))}
    `,
  }),
});

export const adminOrderNotificationTemplate = ({ order, assignment }) => ({
  subject: buildSubjectPrefix(`New order received #${order.id}`),
  html: renderEmailShell({
    title: 'Complete order notification',
    preheader: `Order #${order.id} was placed on OmniShop.`,
    body: `
      ${renderSection('Order summary', renderKeyValueGrid([
        { label: 'Order ID', value: `#${escapeHtml(order.id)}` },
        { label: 'Created at', value: escapeHtml(formatDateTime(order.created_at_iso || order.created_date || new Date())) },
        { label: 'Payment status', value: escapeHtml(order.payment_status || 'pending') },
        { label: 'Payment method', value: escapeHtml(order.payment_method || 'N/A') },
      ]))}
      ${renderSection('Customer details', renderKeyValueGrid([
        { label: 'Name', value: escapeHtml(order.buyer_name || 'N/A') },
        { label: 'Email', value: escapeHtml(order.buyer_email || 'N/A') },
        { label: 'Customer UID', value: escapeHtml(order.buyer_uid || 'N/A') },
      ]))}
      ${renderSection('Delivery person', renderKeyValueGrid([
        { label: 'Name', value: escapeHtml(assignment?.delivery_boy_name || order.assignedDeliveryBoyName || 'Unassigned') },
        { label: 'Email', value: escapeHtml(assignment?.delivery_boy_email || order.assignedDeliveryBoyEmail || 'N/A') },
        { label: 'Assignment status', value: escapeHtml(assignment?.status || order.deliveryStatus || 'pending_assignment') },
      ]))}
      ${renderSection('Delivery address', renderAddressBlock(order.shipping_address || {}))}
      ${renderSection('Items', renderOrderTable(order.items || []))}
      ${renderSection('Operational notes', renderKeyValueGrid([
        { label: 'Ordered products', value: escapeHtml(itemListSummary(order.items || [])) || 'N/A' },
        { label: 'Tracking estimate', value: escapeHtml(formatShortDate(order.delivery_estimate)) },
        { label: 'Assigned delivery date', value: escapeHtml(formatDateTime(assignment?.estimated_delivery_date)) },
      ]))}
    `,
  }),
});

export const orderStatusUpdateTemplate = ({ order, status }) => ({
  subject: buildSubjectPrefix(`Order status updated #${order.id}`),
  html: renderEmailShell({
    title: 'Order status updated',
    preheader: `Order #${order.id} status changed to ${status}.`,
    body: `
      ${renderSection('Status update', renderKeyValueGrid([
        { label: 'Order ID', value: `#${escapeHtml(order.id)}` },
        { label: 'New status', value: escapeHtml(status) },
        { label: 'Payment status', value: escapeHtml(order.payment_status || 'pending') },
        { label: 'Updated at', value: escapeHtml(formatDateTime(new Date())) },
      ]))}
      ${renderSection('Buyer', renderKeyValueGrid([
        { label: 'Name', value: escapeHtml(order.buyer_name || 'N/A') },
        { label: 'Email', value: escapeHtml(order.buyer_email || 'N/A') },
      ]))}
      ${renderSection('Items', renderOrderTable(order.items || []))}
    `,
  }),
});
