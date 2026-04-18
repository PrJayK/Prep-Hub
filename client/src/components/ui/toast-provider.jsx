import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AlertCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

function ToastItem({ toast, onDismiss }) {
	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			onDismiss(toast.id);
		}, toast.duration ?? 5000);

		return () => window.clearTimeout(timeoutId);
	}, [onDismiss, toast.duration, toast.id]);

	return (
		<div
			className={cn(
				"pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-primary/15 bg-card/95 shadow-[0_20px_45px_rgba(37,99,235,0.12)] backdrop-blur-xl",
				"animate-in slide-in-from-top-3 fade-in duration-300"
			)}
			role="status"
			aria-live="polite"
		>
			<div className="flex items-start gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-4">
				<div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
					<AlertCircle className="h-5 w-5" strokeWidth={1.8} />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-foreground">{toast.title}</p>
					{toast.description ? (
						<p className="mt-1 text-sm leading-6 text-foreground/72">{toast.description}</p>
					) : null}
				</div>
				<button
					type="button"
					onClick={() => onDismiss(toast.id)}
					className="rounded-full p-1.5 text-foreground/50 transition hover:bg-muted hover:text-foreground"
					aria-label="Dismiss notification"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const nextIdRef = useRef(0);

	const dismissToast = useCallback((toastId) => {
		setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
	}, []);

	const toast = useCallback(({ title, description, duration }) => {
		const toastId = nextIdRef.current++;

		setToasts((currentToasts) => [
			...currentToasts.slice(-2),
			{
				id: toastId,
				title,
				description,
				duration,
			},
		]);
	}, []);

	const value = useMemo(
		() => ({
			toast,
			dismissToast,
		}),
		[toast, dismissToast]
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed inset-x-0 top-4 z-[110] flex justify-center px-4 sm:top-6 sm:justify-end sm:px-6">
				<div className="flex w-full max-w-md flex-col gap-3">
					{toasts.map((item) => (
						<ToastItem key={item.id} toast={item} onDismiss={dismissToast} />
					))}
				</div>
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error("useToast must be used within a ToastProvider.");
	}

	return context;
}
