import { useEffect, useState } from "react";
import { api } from "../../../services/api";

interface HealthResponse {
  status?: string;
  instance?: string;
  service?: string;
}

interface RoutesResponse {
  service?: string;
  routes?: Record<
    string,
    {
      prefix: string;
      service: string;
    }
  >;
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [routes, setRoutes] = useState<RoutesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError("");

      const [healthResponse, routesResponse] = await Promise.all([
        api.get<HealthResponse>("/api/health"),
        api.get<RoutesResponse>("/api/routes"),
      ]);

      setHealth(healthResponse.data);
      setRoutes(routesResponse.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to load system information.",
      );
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
        <div className="module-state">Loading system information...</div>
      </section>
    );
  }

  return (
    <section className="module-page">
      <div className="module-page-header">
        <div>
          <h1>System</h1>
          <p>Monitor API Gateway and backend runtime information.</p>
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
              <dt>Instance</dt>
              <dd>{health?.instance ?? "-"}</dd>
            </div>

            <div>
              <dt>Service</dt>
              <dd>{health?.service ?? "Backend"}</dd>
            </div>
          </dl>
        </div>

        <div className="module-panel system-card">
          <h2>API Gateway</h2>

          <div className="system-value">
            <span className="system-dot" />
            {routes?.service ?? "api-gateway"}
          </div>

          <div className="gateway-routes">
            {Object.entries(routes?.routes ?? {}).map(
              ([key, route]) => (
                <div className="gateway-route" key={key}>
                  <strong>{route.service}</strong>
                  <span>{route.prefix}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
