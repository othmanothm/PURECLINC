const { sendTemplatedMail, escapeHtml } = require('../utils/mailer');

function formatMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return String(n);
  return x.toFixed(2);
}

function formatTime(t) {
  if (!t) return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** MySQL DATE / string → YYYY-MM-DD for email bodies */
function formatAppointmentDate(d) {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return String(d).slice(0, 10);
  return x.toISOString().slice(0, 10);
}

/**
 * @param {{ to: string, patientName: string, order: object, items: Array<{ product_name?: string, quantity: number, price: number }> }} p
 */
async function notifyOrderConfirmation({ to, patientName, order, items }) {
  const id = order.id;
  const total = formatMoney(order.total_price);
  const method = order.payment_method || '—';
  const lines = (items || [])
    .map((i) => {
      const name = i.product_name || 'Product';
      const line = Number(i.price) * Number(i.quantity);
      return `  • ${name} × ${i.quantity}  @ ${formatMoney(i.price)}  =  ${formatMoney(line)}`;
    })
    .join('\n');

  const subject = `PureSkin Clinic — Order #${id} confirmed`;
  const text = `Hello ${patientName},

Thank you for your purchase. Your order #${id} is confirmed.

Total: ${total}
Payment: ${method}

Items:
${lines || '  (no line items)'}

We will prepare your order shortly. If you chose cash on delivery, please have the amount ready.

— PureSkin Clinic`;

  const html = `
    <p>Hello ${escapeHtml(patientName)},</p>
    <p>Thank you for your purchase. <strong>Order #${escapeHtml(id)}</strong> is confirmed.</p>
    <p><strong>Total:</strong> ${escapeHtml(total)}<br/><strong>Payment:</strong> ${escapeHtml(method)}</p>
    <p><strong>Items</strong></p>
    <pre style="font-family:sans-serif;white-space:pre-wrap;">${escapeHtml(lines || '(no line items)')}</pre>
    <p>— PureSkin Clinic</p>
  `;

  return sendTemplatedMail(to, subject, text, html);
}

const TREATMENT_LABEL = {
  hair: 'Hair',
  skin: 'Skin',
  body: 'Body',
};

/**
 * @param {{ to: string, patientName: string, doctorName: string, specialization?: string|null, date: string, time: string, statusNote?: string, treatmentCategory?: string|null }} p
 */
async function notifyAppointmentBooked({
  to,
  patientName,
  doctorName,
  specialization,
  date,
  time,
  statusNote,
  treatmentCategory,
}) {
  const spec = specialization ? ` (${specialization})` : '';
  const note = statusNote || 'Your booking is pending confirmation by the clinic.';
  const subject = 'PureSkin Clinic — Appointment request received';
  const t = formatTime(time);
  const dateStr = formatAppointmentDate(date);
  const tc = treatmentCategory && TREATMENT_LABEL[treatmentCategory] ? TREATMENT_LABEL[treatmentCategory] : null;
  const treatmentLine = tc ? `Treatment focus: ${tc}` : '';
  const text = `Hello ${patientName},

${note}

${treatmentLine ? `${treatmentLine}\n` : ''}Doctor: ${doctorName}${spec}
Date: ${dateStr}
Time: ${t}

You will receive another email when your appointment is confirmed.

— PureSkin Clinic`;

  const html = `
    <p>Hello ${escapeHtml(patientName)},</p>
    <p>${escapeHtml(note)}</p>
    <p>${tc ? `<strong>Treatment focus:</strong> ${escapeHtml(tc)}<br/>` : ''}
    <strong>Doctor:</strong> ${escapeHtml(doctorName)}${escapeHtml(spec)}<br/>
    <strong>Date:</strong> ${escapeHtml(dateStr)}<br/>
    <strong>Time:</strong> ${escapeHtml(t)}</p>
    <p>You will receive another email when your appointment is confirmed.</p>
    <p>— PureSkin Clinic</p>
  `;

  return sendTemplatedMail(to, subject, text, html);
}

/**
 * @param {{ to: string, patientName: string, doctorName: string, specialization?: string|null, date: string, time: string }} p
 */
async function notifyAppointmentConfirmed({ to, patientName, doctorName, specialization, date, time }) {
  const spec = specialization ? ` (${specialization})` : '';
  const subject = 'PureSkin Clinic — Appointment confirmed';
  const t = formatTime(time);
  const dateStr = formatAppointmentDate(date);
  const text = `Hello ${patientName},

Your appointment has been confirmed.

Doctor: ${doctorName}${spec}
Date: ${dateStr}
Time: ${t}

We look forward to seeing you.

— PureSkin Clinic`;

  const html = `
    <p>Hello ${escapeHtml(patientName)},</p>
    <p>Your appointment has been <strong>confirmed</strong>.</p>
    <p><strong>Doctor:</strong> ${escapeHtml(doctorName)}${escapeHtml(spec)}<br/>
    <strong>Date:</strong> ${escapeHtml(dateStr)}<br/>
    <strong>Time:</strong> ${escapeHtml(t)}</p>
    <p>We look forward to seeing you.</p>
    <p>— PureSkin Clinic</p>
  `;

  return sendTemplatedMail(to, subject, text, html);
}

/**
 * @param {{ to: string, patientName: string, doctorName: string, specialization?: string|null, date: string, time: string, hoursBefore: number }} p
 */
async function notifyAppointmentReminder({
  to,
  patientName,
  doctorName,
  specialization,
  date,
  time,
  hoursBefore,
}) {
  const spec = specialization ? ` (${specialization})` : '';
  const subject = `PureSkin Clinic — Reminder: appointment in about ${hoursBefore} hours`;
  const t = formatTime(time);
  const dateStr = formatAppointmentDate(date);
  const text = `Hello ${patientName},

This is a reminder about your upcoming appointment (in about ${hoursBefore} hours).

Doctor: ${doctorName}${spec}
Date: ${dateStr}
Time: ${t}

— PureSkin Clinic`;

  const html = `
    <p>Hello ${escapeHtml(patientName)},</p>
    <p>This is a reminder about your upcoming appointment <strong>in about ${escapeHtml(String(hoursBefore))} hours</strong>.</p>
    <p><strong>Doctor:</strong> ${escapeHtml(doctorName)}${escapeHtml(spec)}<br/>
    <strong>Date:</strong> ${escapeHtml(dateStr)}<br/>
    <strong>Time:</strong> ${escapeHtml(t)}</p>
    <p>— PureSkin Clinic</p>
  `;

  return sendTemplatedMail(to, subject, text, html);
}

module.exports = {
  formatAppointmentDate,
  notifyOrderConfirmation,
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentReminder,
};
