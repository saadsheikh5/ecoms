import React, { useState } from 'react';
import { Eye, Edit2 } from 'lucide-react';

export default function AdminOrders({ orders, setOrders, categories = [] }) {
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [error, setError] = useState('');

  const getOrderTime = (order) => {
    if (order.time) return order.time;

    const rawDate = order.createdAt || order.updatedAt;
    if (!rawDate) return 'N/A';

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return 'N/A';

    return parsedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setError('');
    try {
      await setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setEditingOrderId(null);
    } catch (err) {
      setError(err.message || 'Unable to update order while the backend is unavailable.');
    }
  };

  const visibleOrders = categoryFilter === 'All Categories'
    ? orders
    : orders.filter(order => (order.categories || []).includes(categoryFilter));

  return (
    <div className="space-y-8">
      <div>
        <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Sales</p>
        <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Orders</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] p-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          Filter By Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
        >
          <option value="All Categories">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#e7e1d8]">
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Order ID</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Customer</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Date</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Payment</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Total</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Status</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e1d8]">
              {visibleOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#d9006c] text-sm">{order.id}</td>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-semibold text-gray-800">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.customerEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <p className="text-gray-700">{order.date}</p>
                    <p className="text-xs text-gray-500">{getOrderTime(order)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{order.paymentMethod || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#d9006c] text-sm">
                    {typeof order.total === 'number' ? `$${order.total.toFixed(2)}` : order.total}
                  </td>
                  <td className="px-6 py-4">
                    {editingOrderId === order.id ? (
                      <select 
                        className="border border-gray-300 rounded p-1.5 text-xs font-bold uppercase tracking-wider focus:ring-1 focus:ring-[#d9006c] outline-none"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        onBlur={() => setEditingOrderId(null)}
                        autoFocus
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => setViewingOrder(order)}
                      className="p-2 text-gray-400 hover:text-[#d9006c] transition-colors rounded hover:bg-gray-100"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => setEditingOrderId(order.id)}
                      className="p-2 text-gray-400 hover:text-[#d9006c] transition-colors rounded hover:bg-gray-100"
                      title="Update Status"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {visibleOrders.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No orders found for this category.
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#d9006c] uppercase tracking-wide">
                Order Details
              </h3>
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(viewingOrder.status)}`}>
                {viewingOrder.status}
              </span>
            </div>
            
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-[#fcfbf9] p-4 rounded border border-[#e7e1d8]">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Order ID</p>
                  <p className="font-semibold text-[#d9006c]">{viewingOrder.id}</p>
                </div>
                <div className="bg-[#fcfbf9] p-4 rounded border border-[#e7e1d8]">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Date Placed</p>
                  <p className="font-semibold text-[#d9006c]">{viewingOrder.date}</p>
                </div>
                <div className="bg-[#fcfbf9] p-4 rounded border border-[#e7e1d8]">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Time Placed</p>
                  <p className="font-semibold text-[#d9006c]">{getOrderTime(viewingOrder)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#d9006c] mb-3 border-b pb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-500">Name:</p>
                  <p className="font-semibold">{viewingOrder.customer}</p>
                  <p className="text-gray-500">Email:</p>
                  <p className="font-semibold">{viewingOrder.customerEmail}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#d9006c] mb-3 border-b pb-2">Payment Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-500">Method:</p>
                  <p className="font-semibold">{viewingOrder.paymentMethod || 'N/A'}</p>
                  <p className="text-gray-500">Total Paid:</p>
                  <p className="font-bold text-[#d9006c] text-lg">
                    {typeof viewingOrder.total === 'number' ? `$${viewingOrder.total.toFixed(2)}` : viewingOrder.total}
                  </p>
                </div>
              </div>
            </div>
              
            <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setViewingOrder(null)}
                className="px-5 py-2.5 rounded bg-[#d9006c] text-white font-semibold text-sm hover:bg-[#ec4899] transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


