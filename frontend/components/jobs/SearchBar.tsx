type SearchBarProps = {
  query: string;
  location: string;
  remoteOnly: boolean;
  visaOnly: boolean;
  sortOrder: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onRemoteToggle: () => void;
  onVisaToggle: () => void;
  onSortChange: (value: string) => void;
  onSearch: () => void;
};

export default function SearchBar({
  query,
  location,
  remoteOnly,
  visaOnly,
  sortOrder,
  loading,
  onQueryChange,
  onLocationChange,
  onRemoteToggle,
  onVisaToggle,
  onSortChange,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="searchPanel">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search roles, skills, or companies"
      />

      <input
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        placeholder="Location"
      />

      <label className="filterToggle">
        <input
          type="checkbox"
          checked={remoteOnly}
          onChange={onRemoteToggle}
        />
        Remote only
      </label>

      <label className="filterToggle">
        <input
          type="checkbox"
          checked={visaOnly}
          onChange={onVisaToggle}
        />
        Visa support
      </label>

      <select
        value={sortOrder}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="match">Sort by match</option>
        <option value="newest">Sort by newest</option>
      </select>

      <button
        type="button"
        className="primaryButton"
        onClick={onSearch}
        disabled={loading}
      >
        {loading ? "Searching..." : "Search Jobs"}
      </button>
    </div>
  );
}