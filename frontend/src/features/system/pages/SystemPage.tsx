import { useEffect, useState } from "react";

import { healthApi } from "../../../services/api/backend";
import { toApiError } from "../../../services/api/errors";

interface HealthResponse {
  status?: string;
  service?: string;
  database?: string;
  timestamp?: string;
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await healthApi.health();

      setHealth(response as HealthResponse);
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSystemData();
  }, []);

  if (loading) {
    return (
      <section className="module-page">
        <div className="module-state">
          Loading system information...
        </div>
      </section>
    );
  }

  return (
    <section className="module-page">
      <div className="module-page-header">
        <div>
          <h1>System</h1>
          <p>Monitor backend and database runtime information.</p>
        </div>

        <button
          type="button"
          className="module-refresh-button"
          onClick={() => void loadSystemData()}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="module-alert module-alert-error">
          {error}
        </div>
      )}

      <div className="system-grid">
        <div className="module-panel system-card">
          <h2>Backend Health</h2>

          <div className="system-value">
            <span className="system-dot" />
            {health?.status ?? "Unknown"}
          </div>

          <dl className="system-details">
            <div>
              <dt>Service</dt>
              <dd>{health?.service ?? "-"}</dd>
            </div>

            <div>
              <dt>Database</dt>
              <dd>{health?.database ?? "-"}</dd>
            </div>

            <div>
              <dt>Last Updated</dt>
              <dd>
                {health?.timestamp
                  ? new Date(health.timestamp).toLocaleString()
                  : "-"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
