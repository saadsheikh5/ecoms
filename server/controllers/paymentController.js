const ApiError = require('../utils/apiError');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Product = require('../models/Product');
const stripe = require('../config/stripe');

const CURRENCY = 'usd';
const TAX_RATE = 0.08;
const SHIPPING_AMOUNT = 10;

function getClientUrl() {
  return process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://jtsbeautyllc.com';
}

function requireStripeConfig() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ApiError('Stripe is not configured on the server.', 500);
  }
}

function cents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function normalizeQuantity(quantity) {
  const parsed = Number(quantity);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}

function normalizeBillingInfo(body) {
  const billingInfo = body.billingInfo || {};
  const customerName = body.customerName
    || `${billingInfo.firstName || ''} ${billingInfo.lastName || ''}`.trim();

  return {
    customerName,
    email: body.email || billingInfo.email,
    phone: body.phone || billingInfo.phone,
    address: body.address || {
      street: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state || '',
      zipCode: billingInfo.zipCode || '',
      country: billingInfo.country || 'US',
    },
  };
}

function pickVariant(product, requestedVariant = {}) {
  if (product.category !== 'Wigs') return null;

  return product.variants.find((variant) => {
    const lengthMatches = !requestedVariant.length || variant.length === requestedVariant.length;
    const densityMatches = !requestedVariant.density || variant.density === requestedVariant.density;
    const skuMatches = !requestedVariant.sku || variant.sku === requestedVariant.sku;
    return lengthMatches && densityMatches && skuMatches;
  }) || product.variants[0];
}

async function buildVerifiedOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError('Checkout requires at least one cart item.', 400);
  }

  const verifiedItems = [];

  for (const item of items) {
    const productId = item.product || item._id || item.id;
    if (!productId) {
      throw new ApiError('One or more cart items are not linked to live inventory.', 400);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError('One or more cart items no longer exist.', 400);
    }

    const variant = pickVariant(product, item.variant || item.specs);
    const price = variant ? variant.price : product.price;
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      throw new ApiError(`"${product.title}" is not available for checkout.`, 400);
    }

    verifiedItems.push({
      product: String(product._id),
      title: product.title,
      category: product.category,
      image: product.image,
      quantity: normalizeQuantity(item.quantity),
      price: Number(price),
      variant: variant ? {
        length: variant.length,
        density: variant.density,
        sku: variant.sku || '',
      } : undefined,
    });
  }

  return verifiedItems;
}

async function calculateDiscount(couponCode, subtotal) {
  if (!couponCode) {
    return { discount: 0, couponCode: '' };
  }

  const normalizedCouponCode = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalizedCouponCode });

  if (!coupon || !coupon.isActive || new Date() > coupon.expiryDate || coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError('Invalid or expired coupon code.', 400);
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new ApiError(`Minimum order of $${coupon.minOrderAmount} required for this coupon.`, 400);
  }

  const discount = coupon.discountType === 'percentage'
    ? (subtotal * coupon.discountValue) / 100
    : coupon.discountValue;

  return {
    discount: Math.min(discount, subtotal),
    couponCode: normalizedCouponCode,
  };
}

function buildLineItems(order) {
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: CURRENCY,
      product_data: {
        name: item.title,
        metadata: {
          productId: item.product,
          ...(item.variant?.sku ? { sku: item.variant.sku } : {}),
        },
      },
      unit_amount: cents(item.price),
    },
    quantity: item.quantity,
  }));

  if (order.shipping > 0) {
    lineItems.push({
      price_data: {
        currency: CURRENCY,
        product_data: { name: 'Shipping' },
        unit_amount: cents(order.shipping),
      },
      quantity: 1,
    });
  }

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: CURRENCY,
        product_data: { name: 'Estimated tax' },
        unit_amount: cents(order.tax),
      },
      quantity: 1,
    });
  }

  return lineItems;
}

// @route   POST /api/payment/create-checkout-session
// @access  Public
const createCheckoutSession = async (req, res, next) => {
  try {
    requireStripeConfig();

    const { customerName, email, phone, address } = normalizeBillingInfo(req.body);
    if (!customerName || !email || !phone || !address?.street || !address?.city || !address?.country) {
      return next(new ApiError('Billing and shipping information is required.', 400));
    }

    const items = await buildVerifiedOrderItems(req.body.items);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { discount, couponCode } = await calculateDiscount(req.body.couponCode, subtotal);
    const discountedSubtotal = Math.max(subtotal - discount, 0);
    const shipping = subtotal > 0 ? SHIPPING_AMOUNT : 0;
    const tax = discountedSubtotal * TAX_RATE;
    const total = discountedSubtotal + shipping + tax;

    const order = await Order.create({
      customerName,
      email,
      phone,
      address,
      items,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      couponCode,
      paymentMethod: 'Stripe Checkout',
      paymentProvider: 'stripe',
      paymentStatus: 'Unpaid',
      notes: req.body.notes || '',
    });

    const clientUrl = getClientUrl().replace(/\/$/, '');
    const sessionOptions = {
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: buildLineItems(order),
      metadata: {
        orderId: String(order._id),
        userId: req.body.userId ? String(req.body.userId) : '',
      },
      success_url: `${clientUrl}/#payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/#payment-cancel?order_id=${order._id}`,
    };

    if (discount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: cents(discount),
        currency: CURRENCY,
        duration: 'once',
        name: couponCode ? `Coupon ${couponCode}` : 'Order discount',
      });
      sessionOptions.discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionOptions, {
      idempotencyKey: `order-${order._id}`,
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.status(201).json({
      success: true,
      sessionUrl: session.url,
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/payment/webhook
// @access  Stripe webhook
const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error(`Stripe webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      const sessionId = session.id;

      let order = orderId ? await Order.findById(orderId) : null;
      if (!order) {
        order = await Order.findOne({ stripeSessionId: sessionId });
      }

      if (!order) {
        console.error(`Stripe webhook could not find order for session ${sessionId}.`);
        return res.json({ received: true });
      }

      if (order.stripeEventIds.includes(event.id)) {
        return res.json({ received: true });
      }

      if (order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'Paid';
        order.orderStatus = 'Processing';
        order.stripePaymentIntentId = session.payment_intent || '';

        if (order.couponCode) {
          await Coupon.findOneAndUpdate(
            { code: order.couponCode },
            { $inc: { usageCount: 1 } }
          );
        }
      }

      order.stripeSessionId = sessionId;
      order.stripeEventIds.push(event.id);
      await order.save();
    } else {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook handling failed: ${error.message}`);
    res.status(500).json({ received: false });
  }
};

module.exports = {
  createCheckoutSession,
  handleStripeWebhook,
};
