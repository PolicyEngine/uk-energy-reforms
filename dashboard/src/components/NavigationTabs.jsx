"use client";

export default function NavigationTabs({
  id,
  label,
  options,
  value,
  onChange,
  compact = false,
}) {
  function navigate(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % options.length;
    if (event.key === "ArrowLeft")
      next = (index + options.length - 1) % options.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (next == null) return;
    event.preventDefault();
    event.currentTarget.parentElement.children[next].focus();
    onChange(options[next].value);
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      className={compact ? "subtabs" : "dashboard-tabs"}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          id={`${id}-tab-${option.value}`}
          role="tab"
          type="button"
          aria-selected={value === option.value}
          aria-controls={`${id}-panel-${option.value}`}
          tabIndex={value === option.value ? 0 : -1}
          onKeyDown={(event) => navigate(event, index)}
          onClick={() => onChange(option.value)}
          className={`tab-button ${value === option.value ? "active" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
