const SHIPPING_METHODS = [
  { name: 'Ground', price: 9.49 },
  { name: 'Standard', price: 13.99 },
  { name: 'Express', price: 63.49 },
];

function getShippingMethodDetails(methodName = 'Ground') {
  const normalizedMethod = String(methodName || 'Ground').trim();
  const selectedMethod = SHIPPING_METHODS.find((method) => method.name === normalizedMethod);
  return selectedMethod || SHIPPING_METHODS[0];
}

function calculateShippingCost(methodName = 'Ground', subtotal = 0) {
  if (Number(subtotal) < 0.01) {
    return 0;
  }

  return getShippingMethodDetails(methodName).price;
}

module.exports = {
  SHIPPING_METHODS,
  getShippingMethodDetails,
  calculateShippingCost,
};
