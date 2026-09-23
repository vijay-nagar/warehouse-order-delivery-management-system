import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ToastMessage { id: number; message: string; }
const ToastContext = createContext<{ notify: (message: string) => void }>({ notify: () => undefined });
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const notify = useCallback((message: string) => {
    const id = Date.now();
    setMessages((current) => [...current, { id, message }]);
    window.setTimeout(() => setMessages((current) => current.filter((item) => item.id !== id)), 4000);
  }, []);
  return <ToastContext.Provider value={{ notify }}>{children}<div className="toast-region" aria-live="polite">{messages.map((item) => <div className="toast" key={item.id}>{item.message}</div>)}</div></ToastContext.Provider>;
}
