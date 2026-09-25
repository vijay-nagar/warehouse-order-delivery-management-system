import type { InputHTMLAttributes } from "react";

export function FormField({ label, id, error, ...inputProps }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string }) {
  return <label className="form-field" htmlFor={id}><span>{label}</span><input id={id} {...inputProps} aria-invalid={Boolean(error)} />{error ? <small className="form-error">{error}</small> : null}</label>;
}
