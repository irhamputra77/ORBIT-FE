type CompactRadioOptionsProps = {
  name: string;
  value?: string;
  options: readonly string[];
  onChange: (value: string) => void;
};

export function CompactRadioOptions({
  name,
  value,
  options,
  onChange,
}: CompactRadioOptionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1" role="radiogroup" aria-label={name}>
      {options.map(option => {
        const selected = value === option;

        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            key={option}
            className="cursor-pointer rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors"
            style={selected
              ? { background: "rgba(2,66,219,0.1)", borderColor: "rgba(2,66,219,0.45)", color: "#0242DB" }
              : { background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
