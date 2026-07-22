type EmptyStateProps = {
  title?: string;
  message?: string;
};

export default function EmptyState({
  title = "No matching jobs found",
  message = "Try a broader role, another location, or turn off one of the filters.",
}: EmptyStateProps) {
  return (
    <div className="emptyState" role="status">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}