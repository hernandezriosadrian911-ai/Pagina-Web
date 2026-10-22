import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Audience = 'Todos' | 'Mujer' | 'Hombre' | 'Niños';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  audience: Exclude<Audience, 'Todos'>;
  featured: boolean;
};

type CartItem = Product & { quantity: number };

const categories = [
  { label: 'Sudaderas', icon: '01' },
  { label: 'Pantalones', icon: '02' },
  { label: 'Playeras', icon: '03' },
  { label: 'Sombreros y gorras', icon: '04' },
  { label: 'Tenis', icon: '05' },
  { label: 'Zapatos', icon: '06' },
  { label: 'Ropa para dormir', icon: '07' },
  { label: 'Deportiva', icon: '08' },
  { label: 'Formal', icon: '09' },
];

const fallbackProducts: Product[] = [];

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price);
}

function App() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [audience, setAudience] = useState<Audience>('Todos');
  const [category, setCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase.from('products').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false });
      if (error) {
        setLoadError('No pudimos cargar el catálogo. Intenta actualizar la página.');
      } else {
        setProducts((data ?? []) as Product[]);
      }
      setIsLoading(false);
    }

    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return products.filter((product) => {
      const matchesAudience = audience === 'Todos' || product.audience === audience;
      const matchesCategory = category === 'Todas' || product.category === category;
      const matchesSearch = !normalizedSearch || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(normalizedSearch);
      return matchesAudience && matchesCategory && matchesSearch;
    });
  }, [audience, category, products, search]);

  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);
      if (existing) {
        return currentCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, direction: number) {
    setCart((currentCart) => currentCart.flatMap((item) => {
      if (item.id !== productId) return [item];
      const quantity = item.quantity + direction;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  function selectAudience(nextAudience: Audience) {
    setAudience(nextAudience);
    setCategory('Todas');
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-[#18211f]">
      <div className="border-b border-[#d9d6ce] bg-[#18211f] px-5 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-[#f7f5f1]">
        Envío gratis en compras mayores a $1,500 MXN
      </div>

      <header className="sticky top-0 z-30 border-b border-[#dedbd3]/80 bg-[#f7f5f1]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-5 lg:px-10">
          <button className="text-left" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="block font-serif text-2xl tracking-[-0.06em] sm:text-3xl">NUEVA</span>
            <span className="-mt-1 block text-[9px] font-semibold uppercase tracking-[0.42em] text-[#7a817a]">selección diaria</span>
          </button>

          <nav className="hidden items-center gap-9 text-sm font-medium lg:flex">
            <button onClick={() => selectAudience('Mujer')} className="transition-colors hover:text-[#b65c3e]">Mujer</button>
            <button onClick={() => selectAudience('Hombre')} className="transition-colors hover:text-[#b65c3e]">Hombre</button>
            <button onClick={() => selectAudience('Niños')} className="transition-colors hover:text-[#b65c3e]">Niños</button>
            <button onClick={() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' })} className="transition-colors hover:text-[#b65c3e]">Categorías</button>
          </nav>

          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 border-b border-[#bdb9af] px-2 py-1.5 text-[#7a817a] sm:flex">
              <Search size={16} strokeWidth={1.7} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className="w-20 bg-transparent text-xs outline-none placeholder:text-[#9b9c95]" />
            </label>
            <button aria-label="Favoritos" className="rounded-full p-2.5 transition-colors hover:bg-white"><Heart size={19} strokeWidth={1.7} /></button>
            <button aria-label="Abrir carrito" onClick={() => setIsCartOpen(true)} className="relative rounded-full p-2.5 transition-colors hover:bg-white"><ShoppingBag size={19} strokeWidth={1.7} />{cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b65c3e] px-1 text-[9px] font-bold text-white">{cartCount}</span>}</button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1380px] gap-5 px-5 pb-16 pt-5 lg:grid-cols-[1.35fr_0.65fr] lg:px-10 lg:pt-8">
          <div className="relative min-h-[480px] overflow-hidden bg-[#d7d0c4] p-8 sm:p-12 lg:min-h-[620px]">
            <img src="https://images.pexels.com/photos/9594950/pexels-photo-9594950.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600" alt="Mujer explorando una selección de prendas" className="absolute inset-0 h-full w-full object-cover object-center mix-blend-multiply opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18211f]/65 via-transparent to-transparent" />
            <div className="relative flex h-full min-h-[420px] flex-col justify-between text-white lg:min-h-[560px]">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em]"><Sparkles size={14} /> colección 01 / otoño</div>
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Vestir lo cotidiano</p>
                <h1 className="max-w-xl font-serif text-5xl leading-[0.92] tracking-[-0.06em] sm:text-7xl lg:text-8xl">Lo esencial,<br /><em className="font-normal">bien elegido.</em></h1>
                <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="mt-8 inline-flex items-center gap-3 border-b border-white pb-2 text-sm font-medium transition-all hover:gap-5">Descubrir la colección <ArrowRight size={17} /></button>
              </div>
            </div>
          </div>
          <div className="flex min-h-[480px] flex-col justify-between bg-[#e8dfd1] p-8 sm:p-12 lg:min-h-[620px]">
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6d736b]"><span>Notas de estilo</span><span>02 / 04</span></div>
            <div><p className="mb-5 max-w-xs text-sm leading-7 text-[#5f665e]">Prendas pensadas para acompañarte. Texturas honestas, tonos fáciles y formas que duran más de una temporada.</p><button onClick={() => selectAudience('Todos')} className="inline-flex items-center gap-2 text-sm font-semibold">Ver todo <ArrowRight size={16} /></button></div>
            <div className="border-t border-[#c9bdad] pt-6"><p className="font-serif text-4xl leading-none tracking-[-0.05em]">Ropa con<br /><em className="font-normal">intención.</em></p></div>
          </div>
        </section>

        <section id="categorias" className="border-y border-[#dedbd3] bg-[#ebe9e3]">
          <div className="mx-auto max-w-[1380px] px-5 py-8 lg:px-10">
            <div className="mb-5 flex items-end justify-between"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#858980]">Explora por</p><h2 className="font-serif text-3xl tracking-[-0.05em]">Categorías</h2></div><span className="hidden text-xs text-[#858980] sm:block">09 maneras de vestir tu día</span></div>
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#d3d0c8] bg-[#d3d0c8] sm:grid-cols-3 lg:grid-cols-9">
              {categories.map((item) => <button key={item.label} onClick={() => { setCategory(item.label); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }} className="group bg-[#ebe9e3] px-3 py-5 text-left transition-colors hover:bg-[#18211f] hover:text-white"><span className="mb-6 block text-[10px] text-[#a1a399] group-hover:text-[#b7c2b5]">{item.icon}</span><span className="block text-xs font-medium leading-4">{item.label}</span></button>)}
            </div>
          </div>
        </section>

        <section id="catalogo" className="mx-auto max-w-[1380px] px-5 py-16 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#858980]">La selección</p><h2 className="font-serif text-4xl tracking-[-0.06em]">Compra tu estilo</h2></div>
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[#d3d0c8] text-sm"><button onClick={() => { setAudience('Todos'); setCategory('Todas'); }} className={`whitespace-nowrap px-3 py-3 transition-colors ${audience === 'Todos' && category === 'Todas' ? 'border-b-2 border-[#18211f] font-semibold' : 'text-[#858980]'}`}>Todo</button>{(['Mujer', 'Hombre', 'Niños'] as Audience[]).map((item) => <button key={item} onClick={() => selectAudience(item)} className={`whitespace-nowrap px-3 py-3 transition-colors ${audience === item ? 'border-b-2 border-[#18211f] font-semibold' : 'text-[#858980]'}`}>{item}</button>)}</div>
          </div>
          <div className="mb-8 flex items-center justify-between text-xs text-[#858980]"><span>{filteredProducts.length} piezas seleccionadas</span><button className="flex items-center gap-2">Ordenar por <ChevronDown size={14} /></button></div>
          {loadError && <div className="mb-6 border border-[#d9aa9b] bg-[#f8e8e2] px-4 py-3 text-sm text-[#8a3f2b]">{loadError}</div>}
          {isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-[#e8e5de]" />)}</div> : filteredProducts.length === 0 ? <div className="border border-dashed border-[#c7c4bb] py-20 text-center"><p className="font-serif text-2xl">No encontramos esa selección.</p><button onClick={() => { setSearch(''); setCategory('Todas'); setAudience('Todos'); }} className="mt-3 text-sm underline">Limpiar filtros</button></div> : <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{filteredProducts.map((product) => <article key={product.id} className="group"><div className="relative mb-4 aspect-[4/5] overflow-hidden bg-[#e5e2dc]"><img src={product.image_url} alt={product.name} className="h-full w-full object-cover grayscale-[15%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /><button aria-label={`Guardar ${product.name}`} className="absolute right-3 top-3 rounded-full bg-white/85 p-2 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"><Heart size={16} strokeWidth={1.7} /></button><span className="absolute left-3 top-3 bg-[#f7f5f1] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]">{product.audience}</span><button onClick={() => { addToCart(product); setIsCartOpen(true); }} className="absolute bottom-0 left-0 right-0 translate-y-full bg-[#18211f] py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-transform group-hover:translate-y-0">Añadir al carrito</button></div><div className="flex items-start justify-between gap-3"><div><p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#858980]">{product.category}</p><h3 className="text-sm font-semibold">{product.name}</h3><p className="mt-1 max-w-[190px] text-xs leading-5 text-[#858980]">{product.description}</p></div><p className="text-sm font-semibold">{formatPrice(product.price)}</p></div></article>)}</div>}
        </section>

        <section className="bg-[#18211f] px-5 py-16 text-[#f7f5f1] lg:px-10"><div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9dac9a]">La filosofía NUEVA</p><p className="max-w-xl font-serif text-4xl leading-[1.05] tracking-[-0.06em] sm:text-5xl">Menos ruido.<br /><em className="font-normal text-[#c4d0c0]">Más tú.</em></p></div><p className="max-w-xs text-sm leading-7 text-[#b5beb2]">Descubre piezas que combinan con tu ritmo, tu espacio y la forma en que quieres sentirte hoy.</p></div></section>
      </main>

      {isCartOpen && <div className="fixed inset-0 z-50 bg-[#18211f]/40" onClick={() => setIsCartOpen(false)}><aside onClick={(event) => event.stopPropagation()} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f7f5f1] p-6 shadow-2xl sm:p-8"><div className="flex items-center justify-between border-b border-[#d9d6ce] pb-5"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#858980]">Tu selección</p><h2 className="font-serif text-3xl tracking-[-0.05em]">Carrito</h2></div><button aria-label="Cerrar carrito" onClick={() => setIsCartOpen(false)} className="rounded-full p-2 hover:bg-white"><X size={20} /></button></div><div className="flex-1 overflow-y-auto py-5">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><ShoppingBag size={34} strokeWidth={1.2} className="mb-4 text-[#858980]" /><p className="font-serif text-2xl">Tu carrito está vacío</p><p className="mt-2 text-sm text-[#858980]">Agrega piezas que te hagan sentir bien.</p></div> : <div className="space-y-5">{cart.map((item) => <div key={item.id} className="flex gap-4"><img src={item.image_url} alt={item.name} className="h-24 w-20 object-cover" /><div className="flex flex-1 flex-col justify-between"><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[#858980]">{formatPrice(item.price)}</p></div><button onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))} className="text-[#858980] hover:text-[#18211f]"><X size={15} /></button></div><div className="flex items-center gap-3 text-xs"><button onClick={() => changeQuantity(item.id, -1)} className="rounded-full border border-[#d3d0c8] p-1"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} className="rounded-full border border-[#d3d0c8] p-1"><Plus size={13} /></button></div></div></div>)}</div>}</div>{cart.length > 0 && <div className="border-t border-[#d9d6ce] pt-5"><div className="mb-4 flex justify-between text-sm"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div><button className="flex w-full items-center justify-center gap-3 bg-[#18211f] py-4 text-sm font-semibold text-white transition-colors hover:bg-[#b65c3e]">Continuar con la compra <ArrowRight size={17} /></button><p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-[#858980]">Impuestos y envío calculados al finalizar</p></div>}</aside></div>}
    </div>
  );
}

export default App;
