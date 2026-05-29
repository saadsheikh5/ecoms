import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminCoupons({ coupons, setCoupons }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const defaultCouponState = { code: '', discount: '', minOrderAmount: '', status: 'Active', usage: 0 };
  const [currentCoupon, setCurrentCoupon] = useState(defaultCouponState);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      setError('');
      try {
        await setCoupons(coupons.filter(c => c.id !== id));
      } catch (err) {
        setError(err.message || 'Unable to delete coupon while the backend is unavailable.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const discountValue = Math.min(Math.max(Number(currentCoupon.discount) || 0, 1), 100);
    const minOrderAmount = Math.max(Number(currentCoupon.minOrderAmount) || 0, 0);
    setError('');
    try {
      await setCoupons([{
        ...currentCoupon,
        id: `COUP-${Date.now()}`,
        discount: `${discountValue}%`,
        discountType: 'percentage',
        discountValue,
        minOrderAmount,
      }, ...coupons]);
      setIsModalOpen(false);
      setCurrentCoupon(defaultCouponState);
    } catch (err) {
      setError(err.message || 'Unable to create coupon while the backend is unavailable.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.3em] text-sm text-[#3a5c4b]">Marketing</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 text-[#d9006c]">Coupons</h2>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#d9006c] text-white px-6 py-3 rounded uppercase tracking-widest text-sm hover:bg-[#ec4899] transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded max-w-4xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-[#e7e1d8] overflow-hidden max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-[#e7e1d8]">
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Code</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Discount</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Minimum</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Status</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500">Usage</th>
                <th className="px-6 py-4 uppercase tracking-widest text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e1d8]">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#d9006c] tracking-widest">{coupon.code}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{coupon.discount}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    ${Number(coupon.minOrderAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      coupon.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{coupon.usage} times</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                      title="Delete Coupon"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {coupons.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No active coupons.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-[#d9006c] uppercase tracking-wide">
              Create Coupon
            </h3>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Coupon Code</label>
                <input 
                  type="text" 
                  required
                  value={currentCoupon.code}
                  onChange={(e) => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all uppercase" 
                  placeholder="e.g., SUMMER20"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Discount Percentage</label>
                <input 
                  type="number"
                  required
                  min="1"
                  max="100"
                  step="1"
                  value={currentCoupon.discount}
                  onChange={(e) => setCurrentCoupon({...currentCoupon, discount: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all" 
                  placeholder="e.g., 20"
                />
                <p className="mt-2 text-xs text-gray-500">Enter a value from 1 to 100. It will be saved as a percentage.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Minimum Cart Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={currentCoupon.minOrderAmount}
                  onChange={(e) => setCurrentCoupon({...currentCoupon, minOrderAmount: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none transition-all"
                  placeholder="e.g., 100"
                />
                <p className="mt-2 text-xs text-gray-500">Coupon applies when the product subtotal reaches this amount.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Status</label>
                <select 
                  value={currentCoupon.status}
                  onChange={(e) => setCurrentCoupon({...currentCoupon, status: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 text-sm focus:border-[#d9006c] focus:ring-1 focus:ring-[#d9006c] outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded bg-[#d9006c] text-white font-semibold text-sm hover:bg-[#ec4899] transition-colors shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


