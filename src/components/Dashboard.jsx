import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { customerName, formatDate, formatMoney, STATUS_STYLES } from '../format'
import StatusBadge from './StatusBadge'
import OrderDrawer from './OrderDrawer'

const REFRESH_MS = 30000
const PAGE_SIZE = 20

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function Dashboard({ admin, onLogout, onAuthError }) {
  const [stats, setStats] = useState(null)
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 })
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Bumped by the Refresh button to force a reload
  const [refreshKey, setRefreshKey] = useState(0)
  const load = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: PAGE_SIZE })
    if (status) params.set('status', status)
    if (query) params.set('q', query)

    let cancelled = false
    const fetchAll = () =>
      Promise.all([api('/orders/stats'), api(`/orders?${params}`)])
        .then(([statsData, ordersData]) => {
          if (cancelled) return
          setStats(statsData)
          setData(ordersData)
          setError('')
          setUpdatedAt(new Date())
        })
        .catch((err) => !cancelled && !onAuthError(err) && setError(err.message))
        .finally(() => !cancelled && setLoading(false))

    fetchAll()
    const t = setInterval(fetchAll, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [page, status, query, refreshKey, onAuthError])

  const closeDrawer = useCallback(() => setSelectedId(null), [])

  const chooseStatus = (value) => {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold text-slate-900">WhatsApp orders</h1>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="hidden text-xs text-slate-400 sm:inline">
                Updated {updatedAt.toLocaleTimeString('en-IN')}
              </span>
            )}
            <button
              onClick={load}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
            <span className="hidden text-sm text-slate-600 md:inline">{admin?.name || admin?.phone}</span>
            <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-900">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total orders" value={stats?.total ?? '—'} hint={stats && `${stats.today} today`} />
          <StatCard label="Revenue (paid)" value={stats ? formatMoney(stats.revenue) : '—'} />
          <StatCard label="Paid" value={stats?.byStatus.paid ?? '—'} />
          <StatCard label="Awaiting payment" value={stats ? stats.byStatus.link_sent + stats.byStatus.pending : '—'} />
        </section>

        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[['', 'All'], ...Object.entries(STATUS_STYLES).map(([key, s]) => [key, s.label])].map(([key, label]) => (
              <button
                key={key || 'all'}
                onClick={() => chooseStatus(key)}
                className={`rounded-full px-3 py-1 text-sm ${
                  status === key
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
                {key && stats && <span className="ml-1 opacity-60">{stats.byStatus[key]}</span>}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, item, order ID…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:w-72"
          />
        </section>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedId(order._id)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(order.orderTimestamp || order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{customerName(order)}</div>
                      <div className="text-xs text-slate-500">{order.phone}</div>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-700">
                      {order.items
                        .map((item) => `${item.name || item.productRetailerId} × ${item.quantity}`)
                        .join(', ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                      {formatMoney(order.totalAmount, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                  </tr>
                ))}

                {!loading && data.orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No orders found
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
              {data.total} order{data.total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                {page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pages}
                className="rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {selectedId && (
        <OrderDrawer key={selectedId} orderId={selectedId} onClose={closeDrawer} onAuthError={onAuthError} />
      )}
    </div>
  )
}

export default Dashboard
