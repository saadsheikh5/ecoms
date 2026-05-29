export const wigStyles = ['Straight', 'Bodywave', 'Deep Wave', 'Water Wave', 'Burmese Curl', 'Pineapple Wave'];

export const wigCategories = [
  {
    title: 'Straight',
    image: 'images/straight.png',
    description: 'JTs Beauty Straight • 250 Density • Transparent Lace',
    price: 'From $250',
    style: 'Straight',
    details: 'Premium straight wig with 250 density transparent lace, 10 inch to 40 inch available',
  },
  {
    title: 'Bodywave',
    image: 'images/body-wave-1.PNG',
    description: 'JTs Beauty Deep Wave 13x4 • 250 Density • Transparent Lace',
    price: 'From $280',
    style: 'Bodywave',
    details: 'Luxurious body wave wig, 10 inch to 40 inch available',
  },
  {
    title: 'Deep Wave',
    image: 'images/2.PNG',
    description: 'JTs Beauty Deep Wave 13x4 • 250 Density • Transparent Lace',
    price: 'From $280',
    style: 'Deep Wave',
    details: 'Elegant deep wave wig, 10 inch to 40 inch available',
  },
  {
    title: 'Water Wave',
    image: 'images/water-wave-2.PNG',
    description: 'JTs Beauty Bodywave 13x4 • 250 Density • Transparent Lace',
    price: 'From $300',
    style: 'Water Wave',
    details: 'Stunning water wave wig, 10 inch to 40 inch available',
  },
  {
    title: 'Burmese Curl',
    image: 'images/burmese-curl-1.PNG',
    description: 'JTs Beauty Water Wave 13x4 • 250 Density • Transparent Lace',
    price: 'From $320',
    style: 'Burmese Curl',
    details: 'Beautiful Burmese curl texture, 10 inch to 40 inch available',
  },
  {
    title: 'Pineapple Wave',
    image: 'images/pineapple wave.PNG',
    description: '13x4 Transparent Lace • 250 Density • 26 inch',
    price: 'From $420',
    style: 'Pineapple Wave',
    details: '26 inch pineapple wave with premium transparent lace',
  },
];

export const featuredProducts = [
  {
    title: 'Tri Color Body Wave',
    price: '$500',
    image: 'images/tri color body wave.png',
    description: 'JTs Beauty Tri Color Body Wave 13x4 • 250 Density • 30 inch • Transparent Lace',
    category: 'Wigs',
    type: 'Featured',
  },
  {
    title: 'Light Color Bob Wig',
    price: '$280',
    image: 'images/light bob wig.jpeg',
    description: '13x4 • 14 inch • 230 Density • Transparent Lace',
    category: 'Wigs',
    type: 'Bob Wigs',
  },
  {
    title: 'Dark Bob Wig',
    price: '$290',
    image: 'images/Dark Bob lace.jpeg',
    description: 'Dark Bob • 13x4 • 14 inch • 230 Density • Transparent Lace',
    category: 'Wigs',
    type: 'Bob Wigs',
  },
];

export const beautyProducts = [
  {
    name: 'JTs Beauty World LG Bonding Glue',
    price: '$7.50',
    category: 'Hair Products',
    id: 'glue-1',
    image: 'images/lace-glue/lace-glue-pro-pineapple.jpeg',
  },
  {
    name: 'JTs Lace Tint - Light Warm Brown',
    price: '$10',
    category: 'Lace Tints',
    id: 'tint-1',
    image: 'images/lace tint spray -light warm brown.jpeg',
  },
  {
    name: 'JTs Lace Tint - Dark Brown',
    price: '$10',
    category: 'Lace Tints',
    id: 'tint-2',
    image: 'images/lace tint spray -dark brown.jpeg',
  },
  {
    name: 'JTs Lace Tint - Medium Brown',
    price: '$10',
    category: 'Lace Tints',
    id: 'tint-3',
    image: 'images/lace tint spray -medium brown.jpeg',
  },
  {
    name: 'JTs Lace Tint - Light Brown',
    price: '$10',
    category: 'Lace Tints',
    id: 'tint-4',
    image: 'images/lace tint spray -light brown.jpeg',
  },
  {
    name: 'JTs Lace Glue Pro - Pineapple',
    price: '$9.99',
    category: 'Hair Products',
    id: 'glue-pineapple',
    image: 'images/lace-glue/lace-glue-pro-pineapple.jpeg',
  },
  {
    name: 'JTs Lace Glue Pro - Strawberry',
    price: '$9.99',
    category: 'Hair Products',
    id: 'glue-strawberry',
    image: 'images/lace-glue/lace-glue-pro-strawberry.jpeg',
  },
  {
    name: 'JTs Lace Glue Pro - Watermelon',
    price: '$9.99',
    category: 'Hair Products',
    id: 'glue-watermelon',
    image: 'images/lace-glue/lace-glue-pro-watermelon.jpeg',
  },
  {
    name: 'JTs Glue Remover',
    price: '$8.99',
    category: 'Hair Products',
    id: 'glue-remover',
    image: 'images/lace-glue/GLUE-REMOVER.jpg',
  },
  {
    name: 'JTs Silkening Mist',
    price: '$10.99',
    category: 'Hair Products',
    id: 'silkening-mist',
    image: 'images/lace-glue/silkening-mist.jpeg',
  },
  {
    name: 'JTs Wax Stick',
    price: '$7.99',
    category: 'Hair Products',
    id: 'wax-stick',
    image: 'images/lace-glue/WAX-STICK.jpg',
  },
];

export const bonnets = [
  { name: 'Black Hair Bonnet', price: '$15', category: 'Bonnets', id: 'bonnet-1', image: 'images/black bonnet.jpg' },
  { name: 'Pink Hair Bonnet', price: '$18', category: 'Bonnets', id: 'bonnet-2', image: 'images/pink bonnet new.jpg' },
  { name: 'White Hair Bonnet', price: '$18', category: 'Bonnets', id: 'bonnet-3', image: 'images/white bonnet new.jpg' },
];

export const hairCareProducts = beautyProducts.filter(p => p.category === 'Hair Products');
export const laceTints = beautyProducts.filter(p => p.category === 'Lace Tints');
export const laceGlues = hairCareProducts.filter(p => p.name && p.name.toLowerCase().includes('glue'));
export const hairProducts = hairCareProducts.filter(p => !laceGlues.includes(p));

export const productCategories = {
  'Wigs': wigCategories.concat(featuredProducts.filter(p => p.category === 'Wigs')),
  'Bonnets': bonnets,
  'Lace Tints': laceTints,
  'Hair Products': hairProducts,
  'Lace Glues': laceGlues,
};

