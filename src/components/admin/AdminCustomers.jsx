import React, { useState } from 'react';
import { Eye, Mail } from 'lucide-react';

export default function AdminCustomers({ customers }) {
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="space-y-8">
      <div>
        <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Users</p>
        <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Customers</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#e7e1d8]">
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Customer</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Email</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Orders</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Total Spent</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Joined</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e1d8]">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#d9006c] text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#d9006c] text-white flex items-center justify-center text-xs font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{customer.email}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{customer.ordersCount}</td>
                  <td className="px-6 py-4 font-bold text-[#d9006c] text-sm">
                    {formatter.format(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{customer.joinDate}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <a 
                      href={`mailto:${customer.email}`}
                      className="inline-block p-2 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50"
                      title="Send Email"
                    >
                      <Mail size={18} />
                    </a>
                    <button 
                      onClick={() => setViewingCustomer(customer)}
                      className="p-2 text-gray-400 hover:text-[#d9006c] transition-colors rounded hover:bg-gray-100"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {customers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No customers found.
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
              <div className="w-16 h-16 rounded-full bg-[#d9006c] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                {viewingCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#d9006c] tracking-wide">
                  {viewingCustomer.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1">{viewingCustomer.email}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#d9006c] mb-4">Customer Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#fcfbf9] p-4 rounded border border-[#e7e1d8] text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Orders</p>
                    <p className="font-bold text-2xl text-[#d9006c]">{viewingCustomer.ordersCount}</p>
                  </div>
                  <div className="bg-[#fcfbf9] p-4 rounded border border-[#e7e1d8] text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Lifetime Value</p>
                    <p className="font-bold text-2xl text-[#d9006c]">{formatter.format(viewingCustomer.totalSpent)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#d9006c] mb-3">Order History (Mock)</h4>
                <div className="border border-[#e7e1d8] rounded overflow-hidden">
                  <div className="bg-[#fcfbf9] px-4 py-3 border-b border-[#e7e1d8] flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                    <span>Order ID</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between text-sm text-[#d9006c] font-semibold border-b border-gray-50">
                    <span>ORD-{Math.floor(Math.random() * 9000) + 1000}</span>
                    <span className="text-gray-500">Recently</span>
                    <span className="text-green-600">Delivered</span>
                  </div>
                  {viewingCustomer.ordersCount > 1 && (
                    <div className="px-4 py-3 flex justify-between text-sm text-[#d9006c] font-semibold">
                      <span>ORD-{Math.floor(Math.random() * 9000) + 1000}</span>
                      <span className="text-gray-500">A while ago</span>
                      <span className="text-green-600">Delivered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
              
            <div className="flex justify-end mt-8 pt-4">
              <button 
                onClick={() => setViewingCustomer(null)}
                className="px-5 py-2.5 rounded bg-[#d9006c] text-white font-semibold text-sm hover:bg-[#ec4899] transition-colors shadow-sm w-full sm:w-auto"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


