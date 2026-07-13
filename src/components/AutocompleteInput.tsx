interface AutocompleteInputProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function AutocompleteInput({
  id,
  label,
  value,
  options,
  placeholder,
  required = false,
  onChange,
}: AutocompleteInputProps) {
  const listId = `${id}-options`;

  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>

      <input
        id={id}
        type="text"
        list={listId}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />

      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

export default AutocompleteInput;