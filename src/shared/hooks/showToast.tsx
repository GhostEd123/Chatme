import Toast, { ToastPosition } from "react-native-toast-message";

interface ToastOptions {
  title: string;
  message?: string;
  position?: ToastPosition;
  visibilityTime?: number;
}

const defaultOptions = (opts: ToastOptions) => ({
  text1: opts.title,
  text2: opts.message,
  position: opts.position ?? ("top" as ToastPosition),
  visibilityTime: opts.visibilityTime ?? 4000,
  autoHide: true,
});

export const showSuccessToast = (opts: ToastOptions) =>
  Toast.show({ type: "success", ...defaultOptions(opts) });

export const showErrorToast = (opts: ToastOptions) =>
  Toast.show({ type: "error", ...defaultOptions(opts) });

export const showWarningToast = (opts: ToastOptions) =>
  Toast.show({ type: "warning", ...defaultOptions(opts) });

export const showInfoToast = (opts: ToastOptions) =>
  Toast.show({ type: "info", ...defaultOptions(opts) });
