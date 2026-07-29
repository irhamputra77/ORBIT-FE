"use client";

import type { EESTemplateDefinition } from "../types";

type TemplateRendererProps<TFields extends object> = {
  definition: EESTemplateDefinition<TFields>;
  values: TFields;
  mode: "form" | "preview";
  onChange?: (values: TFields) => void;
  disabled?: boolean;
};

export function TemplateRenderer<TFields extends object>({
  definition,
  values,
  mode,
  onChange,
  disabled,
}: TemplateRendererProps<TFields>) {
  if (mode === "preview") {
    const Preview = definition.Preview;
    return <Preview values={values} />;
  }

  const Form = definition.Form;
  return (
    <Form
      values={values}
      onChange={onChange ?? (() => undefined)}
      disabled={disabled}
    />
  );
}
