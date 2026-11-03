import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ApplicationFieldType = "text" | "email" | "url" | "number" | "date" | "textarea" | "select";

export interface ApplicationField {
  name: string;
  label: string;
  type?: ApplicationFieldType;
  placeholder?: string;
  options?: string[];
  rows?: number;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  wide?: boolean;
}

export interface ApplicationSection {
  title: string;
  fields: ApplicationField[];
}

/** Renders application questions as labelled, sectioned form fields. */
export function ApplicationFields({ sections }: { sections: ApplicationSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <fieldset key={section.title} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <legend className="w-full border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {section.title}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const id = `application-${field.name}`;
              const wide = field.wide || field.type === "textarea";
              return (
                <div key={field.name} className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                  <Label htmlFor={id}>
                    {field.label}{" "}
                    {!field.required && <span className="font-normal text-slate-500">(optional)</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      name={field.name}
                      rows={field.rows ?? 4}
                      required={field.required}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={id}
                      name={field.name}
                      required={field.required}
                      defaultValue=""
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="" disabled>Choose an option…</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={id}
                      name={field.name}
                      type={field.type ?? "text"}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/** Formats submitted answers as the plain-text message emailed to the team. */
export function applicationMessage(values: FormData, sections: ApplicationSection[]) {
  return sections
    .map((section) =>
      [
        section.title,
        ...section.fields.map(
          (field) => `${field.label}:\n${String(values.get(field.name) ?? "").trim() || "Not provided"}`,
        ),
      ].join("\n\n"),
    )
    .join("\n\n---\n\n");
}
