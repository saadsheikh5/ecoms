import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ products = [], orders = [], customers = [] }) {
  const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered').length;
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock < 5);
  
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(/[^0-9.-]+/g, '')) || 0;
  };

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, order) => sum + parsePrice(order.total), 0);
    
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

  const parseOrderDate = (order) => {
    const rawDate = order.createdAt || order.updatedAt || order.date;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    return parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  };

  const salesData = (() => {
    const salesByDate = new Map();

    orders
      .filter(order => order.status !== 'Cancelled')
      .forEach(order => {
        const orderDate = parseOrderDate(order);
        if (!orderDate) return;

        const dateKey = orderDate.toISOString().slice(0, 10);
        const current = salesByDate.get(dateKey) || 0;
        salesByDate.set(dateKey, current + parsePrice(order.total));
      });

    return Array.from(salesByDate.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-7)
      .map(([date, sales]) => ({
        name: shortDateFormatter.format(new Date(`${date}T00:00:00`)),
        sales,
      }));
  })();

  const stats = [
    { label: 'Total Revenue', value: formatter.format(totalRevenue) },
    { label: 'Total Orders', value: orders.length.toString() },
    { label: 'Total Products', value: products.length.toString() },
    { label: 'Total Customers', value: customers.length.toString() }
  ];
  
  const recentOrders = [...orders].slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Overview</p>
        <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Dashboard</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-[#e7e1d8]">
            <p className="text-gray-500 uppercase tracking-widest text-xs mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-[#d9006c]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-[#e7e1d8]">
          <h3 className="text-xl font-bold mb-6 text-[#d9006c] uppercase tracking-wide">Sales Overview</h3>
          <div className="h-72">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e1d8" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => formatter.format(val)} />
                  <Tooltip
                    formatter={(value) => [formatter.format(value), 'Sales']}
                    contentStyle={{ backgroundColor: '#d9006c', color: '#fff', borderRadius: '8px', border: 'none' }}
                    itemStyle={{ color: '#d4c2aa' }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#d9006c" strokeWidth={3} dot={{ r: 4, fill: '#d9006c' }} activeDot={{ r: 6, fill: '#d4c2aa' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No sales data yet.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e7e1d8]">
          <h3 className="text-xl font-bold mb-6 text-[#d9006c] uppercase tracking-wide">Low Stock Alerts</h3>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <img src={product.image} alt={product.title || product.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                  <div>
                    <p className="font-semibold text-[#d9006c] text-sm line-clamp-1">{product.title || product.name}</p>
                    <p className="text-xs text-red-500 font-bold mt-0.5">{product.stock} in stock</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-sm py-4">All products are well stocked.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e7e1d8]">
        <h3 className="text-xl font-bold mb-6 text-[#d9006c] uppercase tracking-wide">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e7e1d8]">
                <th className="pb-3 uppercase tracking-widest text-xs font-semibold text-gray-500">Order ID</th>
                <th className="pb-3 uppercase tracking-widest text-xs font-semibold text-gray-500">Customer</th>
                <th className="pb-3 uppercase tracking-widest text-xs font-semibold text-gray-500">Total</th>
                <th className="pb-3 uppercase tracking-widest text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e1d8]">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-4 font-semibold text-[#d9006c] text-sm">{order.id}</td>
                  <td className="py-4 text-gray-600 text-sm">{order.customer}</td>
                  <td className="py-4 font-bold text-[#d9006c] text-sm">{typeof order.total === 'number' ? formatter.format(order.total) : order.total}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


