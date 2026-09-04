"use client";

import { useRef, useTransition, type ReactNode } from "react";

// Generic "list of cards + inline add form" used for experience, education,
// skills, and certifications on the profile page — same shape, different
// fields, so one component instead of four near-identical ones.
export function ListSection({
  title,
  emptyLabel,
  items,
  renderItem,
  onAdd,
  onDelete,
  formFields,
}: {
  title: string;
  emptyLabel: string;
  items: { id: string; label: ReactNode }[];
  renderItem?: (item: { id: string; label: ReactNode }) => ReactNode;
  onAdd: (formData: FormData) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  formFields: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await onAdd(formData);
      formRef.current?.reset();
    });
  }

  function handleDelete(id: string) {
    startTransition(() => onDelete(id));
  }

  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/[0.04]">
      <p className="font-medium text-white mb-3">{title}</p>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between border border-white/10 rounded-md px-3 py-2 text-sm text-slate-200">
              {renderItem ? renderItem(item) : item.label}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="text-xs text-red-400 hover:underline disabled:opacity-50 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={handleAdd} className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
        {formFields}
        <button
          type="submit"
          disabled={isPending}
          className="text-sm border border-white/15 text-white rounded-md px-3 py-1.5 hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
