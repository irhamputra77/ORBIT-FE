"use client";

import type { TemplateFieldDefinition } from "../../../types";
import { DatePicker } from "@/components/ui/date-picker";

export function TemplateFormFields<TFields extends object>({
  fields,
  values,
  onChange,
  disabled,
}: {
  fields: readonly TemplateFieldDefinition<TFields>[];
  values: TFields;
  onChange: (values: TFields) => void;
  disabled?: boolean;
}) {
  const update = (name: keyof TFields, value: string | string[]) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <div data-template-form>
      {fields.map(field => {
        const value = values[field.name];
        const stringValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");

        return (
          <label key={String(field.name)}>
            <span>{field.label}</span>
            {field.type === "date" ? (
              <DatePicker
                value={stringValue}
                onChange={nextValue => update(field.name, nextValue)}
                disabled={disabled}
                placeholder={`Select ${field.label.toLowerCase()}`}
                aria-label={field.label}
              />
            ) : field.type === "textarea" ? (
              <textarea disabled={disabled} value={stringValue} onChange={event => update(field.name, event.target.value)} />
            ) : field.type === "select" ? (
              <select disabled={disabled} value={stringValue} onChange={event => update(field.name, event.target.value)}>
                <option value="">Select</option>
                {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : field.type === "radio" ? (
              <span>
                {field.options?.map(option => (
                  <label key={option.value}>
                    <input
                      type="radio"
                      disabled={disabled}
                      name={String(field.name)}
                      checked={stringValue === option.value}
                      onChange={() => update(field.name, option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </span>
            ) : field.type === "checkbox-group" ? (
              <span>
                {field.options?.map(option => {
                  const selectedValues = Array.isArray(value) ? value.map(String) : [];
                  return (
                    <label key={option.value}>
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={selectedValues.includes(option.value)}
                        onChange={() => update(
                          field.name,
                          selectedValues.includes(option.value)
                            ? selectedValues.filter(item => item !== option.value)
                            : [...selectedValues, option.value],
                        )}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </span>
            ) : (
              <input
                disabled={disabled}
                value={stringValue}
                onChange={event => update(field.name, field.type === "string-list"
                  ? event.target.value.split(",").map(item => item.trim()).filter(Boolean)
                  : event.target.value)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
