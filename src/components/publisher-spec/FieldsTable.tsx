import React from "react";
import type { FieldDescriptor } from "../../utils/specRender";

interface FieldsTableProps {
  descriptors: FieldDescriptor[];
}

const typeLabel: Record<FieldDescriptor["type"], string> = {
  string: "string",
  phone: "string (E.164)",
  int: "integer",
  decimal: "decimal",
  bool: "boolean",
  datetime: "ISO 8601"
};

const FieldsTable: React.FC<FieldsTableProps> = ({ descriptors }) => {
  if (descriptors.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No fields documented. Contact your account manager.
      </p>
    );
  }

  return (
    <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden bg-white">
      <table data-testid="fields-table" className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <th className="text-left px-5 py-3 w-1/3">Field</th>
            <th className="text-left px-5 py-3 w-32">Type</th>
            <th className="text-left px-5 py-3 w-32">Required</th>
            <th className="text-left px-5 py-3">Example</th>
          </tr>
        </thead>
        <tbody>
          {descriptors.map((descriptor, index) => (
            <tr
              key={descriptor.name}
              data-testid={`field-row-${descriptor.name}`}
              className={index < descriptors.length - 1 ? "border-b border-slate-100" : ""}
            >
              <td className="px-5 py-4 align-top">
                <code className="font-mono text-[13px] text-slate-900">
                  {descriptor.name}
                </code>
                {descriptor.description && (
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed font-sans">
                    {descriptor.description}
                  </p>
                )}
              </td>
              <td className="px-5 py-4 align-top">
                <span className="text-xs text-slate-600 font-mono">
                  {typeLabel[descriptor.type]}
                </span>
              </td>
              <td className="px-5 py-4 align-top">
                {descriptor.required ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Required
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Optional</span>
                )}
              </td>
              <td className="px-5 py-4 align-top">
                <code className="font-mono text-[12px] text-slate-700 break-all">
                  {descriptor.example}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FieldsTable;
