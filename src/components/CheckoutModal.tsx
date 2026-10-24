import { useState } from 'react';
import { CheckCircle2, Loader2, MapPin, ShoppingBag, Truck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CartItem, CheckoutDetails } from '@/types';

type CheckoutModalProps = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  formatPrice: (price: number) => string;
  userId: string;
  onComplete: () => void;
};

const emptyForm: CheckoutDetails = {
  shippingName: '',
  shippingAddress: '',
  shippingCity: '',
  shippingPostalCode: '',
  shippingPhone: '',
};

function CheckoutModal({ open, onClose, cart, cartTotal, formatPrice, userId, onComplete }: CheckoutModalProps) {
  const [form, setForm] = useState<CheckoutDetails>(emptyForm);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const shippingCost = cartTotal >= 1500 ? 0 : 150;
  const grandTotal = cartTotal + shippingCost;

  function updateField(field: keyof CheckoutDetails, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    if (success) {
      setForm(emptyForm);
      setSuccess(false);
      onComplete();
    }
    setError('');
    setIsLoading(false);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total: grandTotal,
          status: 'pagado',
          shipping_name: form.shippingName,
          shipping_address: form.shippingAddress,
          shipping_city: form.shippingCity,
          shipping_postal_code: form.shippingPostalCode,
          shipping_phone: form.shippingPhone,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos procesar tu compra. Intenta de nuevo.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#18211f]/50 p-4" onClick={handleClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f7f5f1] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d9d6ce] px-6 py-5 sm:px-8">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#858980]">Finalizar compra</p>
            <h2 className="font-serif text-3xl tracking-[-0.05em]">Pago y envío</h2>
          </div>
          <button
            aria-label="Cerrar"
            onClick={handleClose}
            className="rounded-full p-2 text-[#7a817a] transition-colors hover:bg-white hover:text-[#18211f]"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <CheckCircle2 size={56} strokeWidth={1.2} className="mb-5 text-[#3d7a5e]" />
            <h3 className="mb-3 font-serif text-3xl tracking-[-0.05em]">¡Compra confirmada!</h3>
            <p className="max-w-xs text-sm leading-6 text-[#5f665e]">
              Tu pedido quedó registrado. Te enviaremos la confirmación y el seguimiento a tu correo.
            </p>
            <button
              onClick={handleClose}
              className="mt-8 bg-[#18211f] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#b65c3e]"
            >
              Seguir explorando
            </button>
          </div>
        ) : (
          <>
            {/* Order summary */}
            <div className="border-b border-[#d9d6ce] px-6 py-5 sm:px-8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#858980]">Resumen del pedido</p>
              <div className="max-h-36 space-y-2.5 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-xs">
                    <span className="flex-1 text-[#3d443f]">
                      {item.name} <span className="text-[#858980]">×{item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-[#d9d6ce] pt-3 text-sm">
                <div className="flex justify-between text-[#5f665e]">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-[#5f665e]">
                  <span className="flex items-center gap-1.5"><Truck size={14} strokeWidth={1.7} /> Envío</span>
                  <span>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between pt-1 font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#858980]">
                  <MapPin size={13} strokeWidth={1.8} /> Datos de envío
                </div>

                <FormField label="Nombre completo">
                  <input
                    type="text"
                    value={form.shippingName}
                    onChange={(e) => updateField('shippingName', e.target.value)}
                    required
                    className="w-full border-b border-[#bdb9af] bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#18211f]"
                  />
                </FormField>

                <FormField label="Dirección">
                  <input
                    type="text"
                    value={form.shippingAddress}
                    onChange={(e) => updateField('shippingAddress', e.target.value)}
                    required
                    className="w-full border-b border-[#bdb9af] bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#18211f]"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ciudad">
                    <input
                      type="text"
                      value={form.shippingCity}
                      onChange={(e) => updateField('shippingCity', e.target.value)}
                      required
                      className="w-full border-b border-[#bdb9af] bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#18211f]"
                    />
                  </FormField>
                  <FormField label="Código postal">
                    <input
                      type="text"
                      value={form.shippingPostalCode}
                      onChange={(e) => updateField('shippingPostalCode', e.target.value)}
                      required
                      className="w-full border-b border-[#bdb9af] bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#18211f]"
                    />
                  </FormField>
                </div>

                <FormField label="Teléfono">
                  <input
                    type="tel"
                    value={form.shippingPhone}
                    onChange={(e) => updateField('shippingPhone', e.target.value)}
                    required
                    className="w-full border-b border-[#bdb9af] bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#18211f]"
                  />
                </FormField>

                {error && (
                  <p className="rounded-md bg-[#f8e8e2] px-3 py-2 text-xs text-[#8a3f2b]">{error}</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 bg-[#18211f] py-4 text-sm font-semibold text-white transition-colors hover:bg-[#b65c3e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <>
                        <ShoppingBag size={16} strokeWidth={1.8} /> Confirmar compra · {formatPrice(grandTotal)}
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-[#858980]">
                    Pago de demostración, sin cobro real
                  </p>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#5f665e]">{label}</label>
      {children}
    </div>
  );
}

export default CheckoutModal;
