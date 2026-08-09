type Tab<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

type SegmentedTabsProps<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedTabs<T extends string>({ tabs, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="fryd-tabs" role="tablist">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={active}
            key={tab.key}
            className={`fryd-tab ${active ? "is-active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && <span className="fryd-tab-count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
