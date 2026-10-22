/*
# Create public fashion catalog

1. New Tables
- `products` stores the public store catalog.
- `id` is the product identifier.
- `name`, `description`, `price`, `image_url`, `category`, and `audience` define each product shown in the storefront.
- `featured` controls whether a product appears in the featured collection.
- `created_at` records when a product was added.
2. Security
- Row level security is enabled on `products`.
- Anonymous and authenticated visitors may read the shared catalog.
- Anonymous and authenticated visitors may add, update, or remove catalog items because this first version is a single-store public catalog with no sign-in screen.
3. Important notes
- Seed products cover women, men, and children across the requested fashion categories.
- Product images use stable public image URLs for the initial storefront presentation.
*/

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  category text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('Mujer', 'Hombre', 'Niños')),
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can add products" ON public.products;
CREATE POLICY "Public can add products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update products" ON public.products;
CREATE POLICY "Public can update products" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete products" ON public.products;
CREATE POLICY "Public can delete products" ON public.products FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_audience_idx ON public.products (audience);

INSERT INTO public.products (name, description, price, image_url, category, audience, featured)
SELECT * FROM (VALUES
  ('Sudadera Essential', 'Algodón suave, corte relajado y acabado premium.', 899.00, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=900', 'Sudaderas', 'Mujer', true),
  ('Pantalón Wide Leg', 'Silueta amplia en tejido ligero para todos tus planes.', 1099.00, 'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=900', 'Pantalones', 'Mujer', true),
  ('Playera Studio', 'Básica de algodón con una caída impecable.', 499.00, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=900', 'Playeras', 'Mujer', false),
  ('Gorra Weekend', 'Gorra de seis paneles con bordado tonal.', 399.00, 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=900', 'Sombreros y gorras', 'Mujer', false),
  ('Tenis Court 01', 'Diseño minimalista para combinar sin esfuerzo.', 1499.00, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=900', 'Tenis', 'Mujer', true),
  ('Sudadera Everyday', 'Una capa cálida y versátil para diario.', 899.00, 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=900', 'Sudaderas', 'Hombre', false),
  ('Pantalón Tailored', 'Corte recto, estructura limpia y máxima comodidad.', 1199.00, 'https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=900', 'Pantalones', 'Hombre', true),
  ('Playera Heavy Cotton', 'Algodón grueso con silueta contemporánea.', 549.00, 'https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg?auto=compress&cs=tinysrgb&w=900', 'Playeras', 'Hombre', false),
  ('Tenis Runner', 'Amortiguación ligera para acompañar tu ritmo.', 1599.00, 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=900', 'Tenis', 'Hombre', true),
  ('Set de Dormir Mini', 'Set suave y cómodo para noches tranquilas.', 699.00, 'https://images.pexels.com/photos/3661355/pexels-photo-3661355.jpeg?auto=compress&cs=tinysrgb&w=900', 'Ropa para dormir', 'Niños', false),
  ('Sudadera Color Pop', 'Color vibrante y tejido suave para jugar todo el día.', 649.00, 'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=900', 'Sudaderas', 'Niños', true),
  ('Tenis Play', 'Tenis flexibles y resistentes para pequeñas aventuras.', 899.00, 'https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=900', 'Tenis', 'Niños', false),
  ('Conjunto Deportivo', 'Comodidad y libertad para moverse sin límites.', 799.00, 'https://images.pexels.com/photos/863926/pexels-photo-863926.jpeg?auto=compress&cs=tinysrgb&w=900', 'Deportiva', 'Niños', false),
  ('Blazer Atelier', 'Sastrería moderna para ocasiones especiales.', 1799.00, 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=900', 'Formal', 'Hombre', true),
  ('Vestido Gala', 'Elegancia sencilla con una silueta que fluye.', 1899.00, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=900', 'Formal', 'Mujer', false)
) AS seed(name, description, price, image_url, category, audience, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.products);
