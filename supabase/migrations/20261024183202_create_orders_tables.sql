/*
# Create orders tables

1. New Tables
- `orders`: stores a completed purchase made by an authenticated user.
  - id (uuid, primary key)
  - user_id (uuid, references auth.users, defaults to the authenticated user)
  - total (numeric, order total)
  - status (text, defaults to 'pendiente')
  - shipping_name (text, recipient full name)
  - shipping_address (text, shipping street address)
  - shipping_city (text, shipping city)
  - shipping_postal_code (text, shipping postal code)
  - shipping_phone (text, contact phone)
  - created_at (timestamptz, defaults to now())
- `order_items`: stores the individual products included in an order.
  - id (uuid, primary key)
  - order_id (uuid, references orders, cascades on delete)
  - product_id (uuid, references products)
  - name (text, product name snapshot)
  - price (numeric, product price snapshot)
  - quantity (integer, quantity purchased)
2. Security
- RLS enabled on both tables.
- orders: only authenticated users, scoped to their own rows (auth.uid() = user_id).
- order_items: only authenticated users, scoped through the parent order ownership.
- Grants limited to authenticated role.
3. Important notes
- user_id defaults to auth.uid() so inserts omitting it still satisfy RLS.
- order_items copies name/price from the product at purchase time (snapshot) so
  later catalog edits do not change past orders.
*/

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  shipping_name text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

DROP POLICY IF EXISTS "select_own_orders" ON public.orders;
CREATE POLICY "select_own_orders" ON public.orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON public.orders;
CREATE POLICY "insert_own_orders" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON public.orders;
CREATE POLICY "update_own_orders" ON public.orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_orders" ON public.orders;
CREATE POLICY "delete_own_orders" ON public.orders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_order_items" ON public.order_items;
CREATE POLICY "select_own_order_items" ON public.order_items FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_order_items" ON public.order_items;
CREATE POLICY "insert_own_order_items" ON public.order_items FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "update_own_order_items" ON public.order_items;
CREATE POLICY "update_own_order_items" ON public.order_items FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "delete_own_order_items" ON public.order_items;
CREATE POLICY "delete_own_order_items" ON public.order_items FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
