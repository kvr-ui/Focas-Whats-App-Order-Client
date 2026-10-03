export const formatMoney = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(amount || 0)

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

export const customerName = (order) => order.contactName || order.senderName || 'Unknown'

export const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-700 ring-slate-300' },
  link_sent: { label: 'Link sent', className: 'bg-amber-50 text-amber-800 ring-amber-300' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-800 ring-emerald-300' },
  failed: { label: 'Failed', className: 'bg-rose-50 text-rose-800 ring-rose-300' },
}
