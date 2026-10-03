import { useEffect, useState } from 'react'
import { api } from '../api'
import { customerName, formatDate, formatMoney } from '../format'
import StatusBadge from './StatusBadge'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right text-slate-900">{children || '—'}</dd>
    </div>
  )
}

function OrderDrawer({ orderId, onClose, onAuthError }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Parent remounts this per order (key={orderId}), so state starts fresh
    let cancelled = false
    api(`/orders/${orderId}`)
      .then((data) => !cancelled && setOrder(data))
      .catch((err) => !cancelled && (onAuthError(err) || setError(err.message)))
    return () => {
      cancelled = true
    }
  }, [orderId, onAuthError])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-20 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />

      <aside className="relative h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Order details</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
        {!order && !error && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

        {order && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">
                {formatMoney(order.totalAmount, order.currency)}
              </span>
              <StatusBadge status={order.paymentStatus} />
            </div>

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</h3>
            <dl className="mt-1 divide-y divide-slate-100">
              <Row label="Name">{customerName(order)}</Row>
              <Row label="Phone">{order.phone}</Row>
              <Row label="Note">{order.note}</Row>
            </dl>

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4 px-3 py-2 text-sm">
                  <span className="text-slate-900">
                    {item.name || item.productRetailerId}
                    <span className="text-slate-500"> × {item.quantity}</span>
                  </span>
                  <span className="tabular-nums text-slate-700">
                    {formatMoney(item.itemPrice * item.quantity, item.currency || order.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</h3>
            <dl className="mt-1 divide-y divide-slate-100">
              <Row label="Payment link">
                {order.paymentLinkUrl && (
                  <a href={order.paymentLinkUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {order.paymentLinkUrl}
                  </a>
                )}
              </Row>
              <Row label="Link ID">{order.razorpayLinkId}</Row>
              <Row label="Payment ID">{order.razorpayPaymentId}</Row>
            </dl>

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Meta</h3>
            <dl className="mt-1 divide-y divide-slate-100">
              <Row label="Order ID">{order._id}</Row>
              <Row label="Ordered at">{formatDate(order.orderTimestamp || order.createdAt)}</Row>
              <Row label="Last updated">{formatDate(order.updatedAt)}</Row>
              <Row label="Catalog">{order.catalogId}</Row>
            </dl>
          </>
        )}
      </aside>
    </div>
  )
}

export default OrderDrawer
