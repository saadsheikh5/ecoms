// Mock data for the Admin Dashboard

export const defaultMockOrders = [
  { id: 'ORD-1045', customer: 'Jane Doe', customerEmail: 'jane@example.com', date: 'Oct 24, 2026', time: '4:32 PM', total: 250.00, status: 'Pending', paymentMethod: 'Credit Card (Stripe)', categories: ['Wigs'] },
  { id: 'ORD-1044', customer: 'Sarah Smith', customerEmail: 'sarah@example.com', date: 'Oct 23, 2026', time: '11:18 AM', total: 520.00, status: 'Shipped', paymentMethod: 'PayPal', categories: ['Wigs'] },
  { id: 'ORD-1043', customer: 'Alicia Keys', customerEmail: 'alicia@example.com', date: 'Oct 22, 2026', time: '7:05 PM', total: 30.00, status: 'Delivered', paymentMethod: 'Credit Card (Stripe)', categories: ['Lace Tints'] },
  { id: 'ORD-1042', customer: 'Megan Fox', customerEmail: 'megan@example.com', date: 'Oct 20, 2026', time: '2:46 PM', total: 1200.00, status: 'Delivered', paymentMethod: 'Apple Pay', categories: ['Wigs'] },
  { id: 'ORD-1041', customer: 'Chloe Davis', customerEmail: 'chloe@example.com', date: 'Oct 19, 2026', time: '9:27 AM', total: 280.00, status: 'Cancelled', paymentMethod: 'Credit Card (Stripe)', categories: ['Hair Products'] },
];

export const defaultMockCustomers = [
  { id: 'CUST-001', name: 'Jane Doe', email: 'jane@example.com', totalSpent: 250.00, ordersCount: 1, joinDate: 'Oct 24, 2026' },
  { id: 'CUST-002', name: 'Sarah Smith', email: 'sarah@example.com', totalSpent: 800.00, ordersCount: 3, joinDate: 'Sep 15, 2026' },
  { id: 'CUST-003', name: 'Alicia Keys', email: 'alicia@example.com', totalSpent: 120.00, ordersCount: 2, joinDate: 'Aug 05, 2026' },
  { id: 'CUST-004', name: 'Megan Fox', email: 'megan@example.com', totalSpent: 1200.00, ordersCount: 1, joinDate: 'Oct 20, 2026' },
];

export const defaultMockReviews = [
  { id: 'REV-001', customer: 'Sarah Smith', product: 'Bodywave Wig', category: 'Wigs', rating: 5, comment: 'Absolutely love the quality!', date: 'Oct 25, 2026', showOnHome: true },
  { id: 'REV-002', customer: 'Jane Doe', product: 'Lace Tint', category: 'Lace Tints', rating: 4, comment: 'Matches my skin perfectly.', date: 'Oct 24, 2026', showOnHome: false },
  { id: 'REV-003', customer: 'Alicia Keys', product: 'Straight Wig', category: 'Wigs', rating: 5, comment: 'So soft and holds curls well.', date: 'Oct 10, 2026', showOnHome: true },
];

export const defaultMockCoupons = [
  { id: 'COUP-1', code: 'WELCOME10', discount: '10%', minOrderAmount: 100, status: 'Active', usage: 45 },
  { id: 'COUP-2', code: 'SUMMER20', discount: '20%', minOrderAmount: 200, status: 'Expired', usage: 120 },
  { id: 'COUP-3', code: 'VIP15', discount: '15%', minOrderAmount: 150, status: 'Active', usage: 8 },
];

export const defaultMockCategories = [
  { id: 'CAT-1', name: 'Wigs', productCount: 15 },
  { id: 'CAT-2', name: 'Bonnets', productCount: 3 },
  { id: 'CAT-3', name: 'Lace Tints', productCount: 4 },
  { id: 'CAT-4', name: 'Hair Products', productCount: 6 },
  { id: 'CAT-5', name: 'Lace Glues', productCount: 3 },
];

export const defaultMockSalesData = [
  { name: 'Mon', sales: 400 },
  { name: 'Tue', sales: 300 },
  { name: 'Wed', sales: 550 },
  { name: 'Thu', sales: 400 },
  { name: 'Fri', sales: 700 },
  { name: 'Sat', sales: 900 },
  { name: 'Sun', sales: 1200 },
];
