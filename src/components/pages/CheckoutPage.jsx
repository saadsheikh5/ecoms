import React, { useRef, useState } from 'react';
import { createStripeCheckoutSession, placeOrder, validateCoupon } from '../../services/api';

export default function CheckoutPage({
  cartDetails,
  setActivePage,
  onOrderSuccess,
  apiAvailable = true
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponResult, setCouponResult] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const resultRef = useRef(null);
  
  // Form States for billing information
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const subtotal = cartDetails.reduce((sum, item) => {
    const itemPrice = parseFloat(String(item.price).replace('$', '').replace('From ', '')) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + itemPrice * quantity;
  }, 0);
  
  const discount = Math.min(appliedCoupon?.discount || 0, subtotal);
  const discountedSubtotal = Math.max(subtotal - discount, 0);
  const shipping = subtotal > 0 ? 10.00 : 0.00;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + shipping + tax;

  const handleApplyCoupon = async () => {
    if (!apiAvailable) {
      setCouponResult({
        success: false,
        message: 'Coupons are temporarily unavailable while the store reconnects to the API.'
      });
      return;
    }

    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      setCouponResult({
        success: false,
        message: 'Enter a coupon code to apply.'
      });
      return;
    }

    if (cartDetails.length === 0) {
      setCouponResult({
        success: false,
        message: 'Add an item to your cart before applying a coupon.'
      });
      return;
    }

    setIsApplyingCoupon(true);
    setCouponResult(null);

    try {
      const coupon = await validateCoupon(trimmedCode, subtotal);
      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
      setCouponResult({
        success: true,
        message: `${coupon.code} applied to your cart subtotal. You saved $${Math.min(coupon.discount, subtotal).toFixed(2)}.`
      });
    } catch (error) {
      setAppliedCoupon(null);
      setCouponResult({
        success: false,
        message: error.status === 503
          ? 'Coupons are temporarily unavailable. Please try again in a few minutes.'
          : error.message || 'Unable to apply coupon.'
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponResult(null);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!apiAvailable) {
      setSubmitResult({
        success: false,
        message: 'Ordering and payment actions are paused while the store API is unavailable. Your cart has not been charged or submitted.'
      });
      return;
    }

    if (cartDetails.length === 0) {
      setSubmitResult({
        success: false,
        message: 'Your cart is empty. Add an item before placing an order.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      if (paymentMethod === 'Card') {
        const response = await createStripeCheckoutSession({
          billingInfo,
          items: cartDetails,
          couponCode: appliedCoupon?.code || '',
          apiAvailable
        });

        window.location.href = response.sessionUrl;
        return;
      }

      // Connects directly to the API service layer
      const response = await placeOrder({
        billingInfo,
        paymentMethod,
        items: cartDetails,
        amount: total,
        subtotal,
        discount,
        shipping,
        tax,
        couponCode: appliedCoupon?.code || '',
        apiAvailable
      });

      if (response.success) {
        setCompletedOrder({
          orderId: response.orderId,
          total
        });
        onOrderSuccess?.({ redirect: false });
      } else {
        throw new Error(response.message || 'Unable to place your order.');
      }
    } catch (error) {
      const message = error.status === 503
        ? 'Ordering is temporarily unavailable. Your cart has not been charged or submitted. Please try again in a few minutes.'
        : error.isBackendUnavailable
        ? 'We could not place your order because the backend server is down. Your cart has not been charged or submitted. Please try again when the server is back online.'
        : error.message || 'An error occurred while placing your order.';

      setSubmitResult({
        success: false,
        message
      });
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <section className="min-h-screen bg-[#D5E8D4] px-4 py-8 sm:px-8 flex items-center">
        <div className="max-w-2xl mx-auto w-full bg-white border border-[#D5E8D4] shadow-xl p-8 sm:p-12 text-center">
          <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
            Order Confirmed
          </p>
          <h2 className="text-4xl sm:text-5xl font-black mt-4 uppercase text-[#d9006c]">
            Thank You For Shopping
          </h2>
          <p className="mt-5 text-gray-600 leading-relaxed">
            Your order has been placed successfully. We appreciate your purchase and will begin processing it shortly.
          </p>

          <div className="mt-8 border border-[#D5E8D4] bg-[#D5E8D4] p-5 text-left space-y-3">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Order ID</span>
              <span className="font-bold text-[#d9006c] text-right">{completedOrder.orderId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-[#d9006c]">${completedOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePage('home')}
            className="mt-8 w-full sm:w-auto bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300"
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#D5E8D4] px-4 py-8 sm:px-8">
      <form onSubmit={handleSubmitOrder} className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <p className="uppercase tracking-[0.3em] text-sm text-[#d9006c] font-bold">
              Secure Checkout
            </p>
            <h2 className="text-5xl font-black mt-4 uppercase text-[#d9006c]">
              Complete Your Order
            </h2>
          </div>

          {submitResult && (
            <div className={`p-4 mb-6 border ${
              submitResult.success 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`} role="alert" ref={resultRef}>
              {submitResult.message}
            </div>
          )}

          {!apiAvailable && (
            <div className="p-4 mb-6 border bg-red-50 text-red-800 border-red-200" role="alert">
              Live checkout is temporarily unavailable. Order placement, Stripe Checkout, and coupon validation are disabled until the API reconnects.
            </div>
          )}

          <div className="bg-white p-8 shadow-xl border border-[#D5E8D4] mb-8">
            <h3 className="text-2xl font-semibold mb-6 uppercase tracking-[0.15em]">
              Billing Information
            </h3>

            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <input 
                  required
                  name="firstName"
                  value={billingInfo.firstName}
                  onChange={handleBillingChange}
                  placeholder="First Name" 
                  className="border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
                />
                <input 
                  required
                  name="lastName"
                  value={billingInfo.lastName}
                  onChange={handleBillingChange}
                  placeholder="Last Name" 
                  className="border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
                />
              </div>

              <input 
                required
                type="email"
                name="email"
                value={billingInfo.email}
                onChange={handleBillingChange}
                placeholder="Email Address" 
                className="w-full border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
              />
              <input 
                required
                name="phone"
                value={billingInfo.phone}
                onChange={handleBillingChange}
                placeholder="Phone Number" 
                className="w-full border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
              />
              <input 
                required
                name="address"
                value={billingInfo.address}
                onChange={handleBillingChange}
                placeholder="Street Address" 
                className="w-full border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
              />
              
              <div className="grid sm:grid-cols-3 gap-5">
                <input 
                  required
                  name="city"
                  value={billingInfo.city}
                  onChange={handleBillingChange}
                  placeholder="City" 
                  className="border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
                />
                <input 
                  required
                  name="state"
                  value={billingInfo.state}
                  onChange={handleBillingChange}
                  placeholder="State" 
                  className="border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
                />
                <input 
                  required
                  name="zipCode"
                  value={billingInfo.zipCode}
                  onChange={handleBillingChange}
                  placeholder="ZIP Code" 
                  className="border border-[#D5E8D4] p-4 outline-none focus:border-[#d9006c]" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 shadow-xl border border-[#D5E8D4]">
            <h3 className="text-2xl font-semibold mb-6 uppercase tracking-[0.15em]">
              Payment Information
            </h3>

            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {['Card', 'Cash on Delivery'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 border p-4 cursor-pointer transition-all duration-300 ${
                      paymentMethod === method
                        ? 'border-[#d9006c] bg-[#D5E8D4] shadow-sm'
                        : 'border-[#D5E8D4] bg-white hover:border-[#d9006c]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={!apiAvailable}
                      className="h-4 w-4 accent-[#d9006c]"
                    />
                    <span className="font-semibold text-[#d9006c]">{method}</span>
                  </label>
                ))}
              </div>

              {paymentMethod === 'Card' && (
                <div className="border border-[#D5E8D4] bg-[#D5E8D4] p-4 text-sm text-[#d9006c]">
                  Card payments are processed securely through Stripe Checkout. After placing your order, you will be redirected to Stripe to enter payment details.
                </div>
              )}

              {paymentMethod === 'Cash on Delivery' && (
                <div className="border border-[#D5E8D4] bg-[#D5E8D4] p-4 text-sm text-[#d9006c]">
                  Pay with cash when your order is delivered.
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-8 shadow-xl border border-[#D5E8D4] sticky top-24">
            <h3 className="text-2xl font-semibold mb-6 uppercase tracking-[0.15em]">
              Order Summary
            </h3>

            <div className="divide-y divide-[#e7e1d8] max-h-[400px] overflow-y-auto mb-6">
              {cartDetails.map((item) => {
                const itemPrice = parseFloat(String(item.price).replace('$', '').replace('From ', '')) || 0;
                const quantity = Math.max(1, Number(item.quantity) || 1);
                const lineTotal = itemPrice * quantity;

                return (
                <div key={item.cartId} className="py-4">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{item.title || item.name}</p>
                      <p className="text-xs text-gray-400 mt-1">Qty {quantity} x {item.price}</p>
                    </div>
                    <p className="font-bold">${lineTotal.toFixed(2)}</p>
                  </div>
                  {item.description && <p className="text-xs text-gray-500">{item.description.substring(0, 50)}...</p>}
                </div>
                );
              })}
            </div>

            <div className="border-y border-[#D5E8D4] py-5 mb-6">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    if (appliedCoupon) setAppliedCoupon(null);
                    if (couponResult) setCouponResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  placeholder="WELCOME10"
                  disabled={Boolean(appliedCoupon) || !apiAvailable}
                  className="min-w-0 flex-1 border border-[#D5E8D4] px-3 py-3 text-sm uppercase outline-none focus:border-[#d9006c] disabled:bg-[#D5E8D4]"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="border border-[#d9006c] px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#d9006c] hover:bg-[#d9006c] hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || cartDetails.length === 0 || !apiAvailable}
                    className="bg-[#d9006c] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#ec4899] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplyingCoupon ? 'Applying' : 'Apply'}
                  </button>
                )}
              </div>
              {couponResult && (
                <p className={`mt-2 text-xs ${couponResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {couponResult.message}
                </p>
              )}
            </div>

            <div className="border-t-2 border-[#d9006c] pt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <span>Discount{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}</span>
                  <span className="font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">${shipping.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center bg-[#D5E8D4] p-3 mt-4">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-[#d9006c]">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || cartDetails.length === 0 || !apiAvailable}
              title={!apiAvailable ? 'Order placement and payments are disabled while store services reconnect.' : 'Place order'}
              className="w-full bg-[#d9006c] text-white py-5 uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? 'Processing Order...' : 'Place Order'}
            </button>

            {submitResult && !submitResult.success && (
              <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {submitResult.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => setActivePage('home')}
              className="w-full bg-[#d9006c] text-white px-4 py-3 text-sm uppercase tracking-[0.2em] font-semibold hover:bg-[#ec4899] transition-all duration-300 mt-6"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}




