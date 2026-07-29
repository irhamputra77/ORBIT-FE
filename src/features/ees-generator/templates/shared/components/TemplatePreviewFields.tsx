import type { TemplateFieldDefinition } from "../../../types";

export function TemplatePreviewFields<TFields extends object>({
  fields,
  values,
}: {
  fields: readonly TemplateFieldDefinition<TFields>[];
  values: TFields;
}) {
  return (
    <dl data-template-preview>
      {fields.map(field => {
        const value = values[field.name];
        return (
          <div key={String(field.name)}>
            <dt>{field.label}</dt>
            <dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</dd>
          </div>
        );
      })}
    </dl>
  );
}
