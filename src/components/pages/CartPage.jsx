import React from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';

export default function CartPage({
  cart,
  cartDetails,
  handleRemoveFromCart,
  handleUpdateCartQuantity,
  setActivePage,
  commerceDisabled = false,
  apiStatus
}) {
  const getItemPrice = (item) => parseFloat(String(item.price).replace('$', '').replace('From ', '')) || 0;
  const getItemQuantity = (item) => Math.max(1, Number(item.quantity) || 1);
  const subtotal = cartDetails.reduce((sum, item) => {
    return sum + getItemPrice(item) * getItemQuantity(item);
  }, 0);

  return (
    <section className="min-h-screen bg-[#D5E8D4] px-4 py-8 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
              Shopping Cart
            </p>
            <h2 className="text-5xl font-black mt-3 uppercase">
              Your Cart
            </h2>
          </div>

        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="bg-white border border-[#f9c0d9] overflow-hidden flex-1">
            {cart.length === 0 ? (
              <div className="p-10 sm:p-20 text-center">
                <ShoppingBag size={60} className="mx-auto mb-6 text-[#d9006c]" />
                <h3 className="text-3xl font-semibold">Your cart is empty</h3>
                <p className="mt-4 text-gray-500">
                  Add your favorite wigs to begin shopping.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eee]">
                {cartDetails.map((item) => {
                  const quantity = getItemQuantity(item);
                  const itemTotal = getItemPrice(item) * quantity;

                  return (
                  <div key={item.cartId} className="p-4 sm:p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between hover:bg-[#fff8fb] transition-colors">
                    <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title || item.name}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover border border-[#f9c0d9] bg-[#D5E8D4]"
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-lg sm:text-xl font-semibold leading-tight">{item.title || item.name}</h4>
                        <p className="text-gray-500 mt-1 text-sm line-clamp-2">{item.description}</p>
                        {item.specs && (
                          <p className="text-xs uppercase tracking-widest text-gray-400 mt-2">
                            {item.specs.length} / {item.specs.density}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-[#d9006c] mt-3 sm:hidden">
                          {item.price} each
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end sm:min-w-[290px]">
                      <div className="flex items-center border border-[#f9c0d9] bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.cartId, -1)}
                          disabled={commerceDisabled}
                          title={commerceDisabled ? 'Cart changes are disabled while store services reconnect.' : 'Decrease quantity'}
                          className="h-11 w-11 flex items-center justify-center text-[#d9006c] hover:bg-[#D5E8D4] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Decrease quantity for ${item.title || item.name}`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="h-11 min-w-[48px] px-3 flex items-center justify-center border-x border-[#f9c0d9] font-bold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(item.cartId, 1)}
                          disabled={commerceDisabled}
                          title={commerceDisabled ? 'Cart changes are disabled while store services reconnect.' : 'Increase quantity'}
                          className="h-11 w-11 flex items-center justify-center text-[#d9006c] hover:bg-[#D5E8D4] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Increase quantity for ${item.title || item.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="min-w-[110px] text-right">
                        <p className="font-bold text-xl">{`$${itemTotal.toFixed(2)}`}</p>
                        <p className="text-xs text-gray-400 hidden sm:block">{item.price} each</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.cartId)}
                        className="h-11 w-11 flex items-center justify-center border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                        aria-label={`Remove ${item.title || item.name} from cart`}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="bg-white border border-[#f9c0d9] p-6 lg:w-[340px] lg:sticky lg:top-28">
            <p className="uppercase tracking-[0.25em] text-xs text-[#d9006c] font-bold mb-4">
              Order Summary
            </p>
            <div className="space-y-4 mb-6 pb-5 border-b border-[#f9c0d9]">
              <div className="flex justify-between items-center text-gray-600">
                <span>Items</span>
                <span className="font-semibold text-[#1a1a1a]">{cart.reduce((total, item) => total + getItemQuantity(item), 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Subtotal</span>
                <span className="text-2xl font-bold text-[#d9006c]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setActivePage('checkout')}
              disabled={cart.length === 0 || commerceDisabled}
              title={commerceDisabled ? 'Checkout is disabled while store services reconnect.' : 'Proceed to checkout'}
              className="w-full bg-[#d9006c] text-white px-6 py-5 uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commerceDisabled ? 'Checkout Unavailable' : 'Proceed To Checkout'}
            </button>
            {commerceDisabled && (
              <p className="mt-3 text-xs text-red-700 leading-relaxed">
                Checkout and payment actions are paused while the store reconnects to the API.
              </p>
            )}
            <button
              onClick={() => setActivePage('home')}
              className="w-full mt-3 border border-[#d9006c] text-[#d9006c] px-6 py-4 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#d9006c] hover:text-white transition-all duration-300"
            >
              Continue Shopping
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}


