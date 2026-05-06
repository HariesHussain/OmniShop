const brandName = 'OmniShop';

export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatShortDate = (value) => {
  if (!value) return 'N/A';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

export const renderEmailShell = ({ title, preheader = '', body }) => `
  <div style="background:#f8fafc;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%);padding:28px 32px;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#fb923c;font-weight:700;">${brandName}</div>
                <div style="font-size:28px;line-height:1.2;font-weight:800;margin-top:10px;">${escapeHtml(title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6;">
                This is an automated message from ${brandName}. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

export const renderSection = (heading, content) => `
  <div style="margin-bottom:24px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f97316;margin-bottom:8px;">${escapeHtml(heading)}</div>
    ${content}
  </div>
`;

export const renderKeyValueGrid = (rows = []) => {
  const items = rows.map(({ label, value }) => `
    <div style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;">
      <div style="font-size:12px;color:#64748b;margin-bottom:4px;">${escapeHtml(label)}</div>
      <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.5;">${value}</div>
    </div>
  `).join('');

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">${items}</div>`;
};

export const renderOrderTable = (items = []) => {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.title || 'Product')}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e2e8f0;">${Number(item.quantity || 1)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e2e8f0;">${formatCurrency(item.price)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.seller_name || item.seller_email || 'N/A')}</td>
    </tr>
  `).join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f8fafc;color:#334155;">
          <th align="left" style="padding:12px 10px;border-bottom:1px solid #cbd5e1;">Item</th>
          <th align="left" style="padding:12px 10px;border-bottom:1px solid #cbd5e1;">Qty</th>
          <th align="left" style="padding:12px 10px;border-bottom:1px solid #cbd5e1;">Price</th>
          <th align="left" style="padding:12px 10px;border-bottom:1px solid #cbd5e1;">Seller</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="4" style="padding:12px 10px;">No items</td></tr>'}
      </tbody>
    </table>
  `;
};

export const renderAddressBlock = (address = {}) => `
  <div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;line-height:1.7;">
    <div style="font-weight:700;margin-bottom:4px;">${escapeHtml(address.name || 'Customer')}</div>
    <div>${escapeHtml(address.phone || 'N/A')}</div>
    <div>${escapeHtml(address.address || 'N/A')}</div>
    <div>${escapeHtml([address.city, address.state].filter(Boolean).join(', ') || 'N/A')}</div>
    <div>${escapeHtml(address.pincode || 'N/A')}</div>
  </div>
`;

export const buildSubjectPrefix = (subject) => `[OmniShop] ${subject}`;