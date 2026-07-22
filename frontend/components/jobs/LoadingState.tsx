export default function LoadingState() {
  return (
    <div className="loadingState" role="status" aria-live="polite">
      <span className="loadingSpinner" aria-hidden="true" />
      <div>
        <strong>Searching for opportunities...</strong>
        <p>CareerPilot is checking live job sources and calculating your matches.</p>
      </div>
    </div>
  );
}