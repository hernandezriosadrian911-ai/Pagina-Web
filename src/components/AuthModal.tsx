import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Lock, User, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/types';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: (user: SessionUser) => void;
  initialMode?: 'login' | 'signup';
};

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Débil', color: '#c45a3a' };
  if (score <= 2) return { score, label: 'Aceptable', color: '#b8893a' };
  if (score <= 3) return { score, label: 'Buena', color: '#5a8a4a' };
  return { score, label: 'Fuerte', color: '#3d7a5e' };
}

function AuthModal({ open, onClose, onAuthSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setFullName('');
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user) {
          onAuthSuccess({ id: data.user.id, email: data.user.email ?? email });
          onClose();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) {
          onAuthSuccess({ id: data.user.id, email: data.user.email ?? email });
          onClose();
        }
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      let friendly = rawMessage;
      if (rawMessage.includes('weak_password') || rawMessage.includes('Password is known to be weak')) {
        friendly = 'Esa contraseña es demasiado común o insegura. Usa una combinación de letras, números y símbolos, de al menos 6 caracteres.';
      } else if (rawMessage === 'Invalid login credentials') {
        friendly = 'Correo o contraseña incorrectos.';
      } else if (rawMessage === 'User already registered') {
        friendly = 'Este correo ya está registrado. Inicia sesión.';
      } else if (rawMessage.includes('Password should be at least')) {
        friendly = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (rawMessage.includes('Unable to validate email address') || rawMessage.includes('invalid')) {
        friendly = 'El correo electrónico no es válido.';
      } else if (rawMessage.includes('rate limit') || rawMessage.includes('too many')) {
        friendly = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
      } else if (rawMessage.includes('fetch') || rawMessage.includes('Failed to fetch')) {
        friendly = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
      }
      setError(friendly);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#18211f]/50 p-4" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#f7f5f1] shadow-2xl"
      >
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#7a817a] transition-colors hover:bg-white hover:text-[#18211f]"
        >
          <X size={18} />
        </button>

        <div className="px-7 pb-8 pt-10">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#858980]">
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Únete a NUEVA'}
          </p>
          <h2 className="mb-7 font-serif text-3xl tracking-[-0.05em]">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5f665e]">Nombre completo</label>
                <div className="flex items-center gap-2.5 border-b border-[#bdb9af] px-2 py-2 focus-within:border-[#18211f]">
                  <User size={16} strokeWidth={1.7} className="text-[#7a817a]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b9c95]"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#5f665e]">Correo electrónico</label>
              <div className="flex items-center gap-2.5 border-b border-[#bdb9af] px-2 py-2 focus-within:border-[#18211f]">
                <Mail size={16} strokeWidth={1.7} className="text-[#7a817a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b9c95]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#5f665e]">Contraseña</label>
              <div className="flex items-center gap-2.5 border-b border-[#bdb9af] px-2 py-2 focus-within:border-[#18211f]">
                <Lock size={16} strokeWidth={1.7} className="text-[#7a817a]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b9c95]"
                  minLength={6}
                  required
                />
              </div>
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className="flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: strength.score >= bar ? strength.color : '#d9d6ce',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              {mode === 'signup' && (
                <p className="mt-1.5 text-[10px] text-[#9b9c95]">
                  Usa una combinación de letras, números y símbolos. Evita contraseñas comunes.
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-md bg-[#f8e8e2] px-3 py-2 text-xs text-[#8a3f2b]">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#18211f] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#b65c3e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#7a817a]">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="font-semibold text-[#18211f] underline-offset-2 hover:underline"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="font-semibold text-[#18211f] underline-offset-2 hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
