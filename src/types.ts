export type Audience = 'Todos' | 'Mujer' | 'Hombre' | 'Niños';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  audience: Exclude<Audience, 'Todos'>;
  featured: boolean;
};

export type CartItem = Product & { quantity: number };

export type SessionUser = {
  id: string;
  email: string;
};

export type CheckoutDetails = {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
};
