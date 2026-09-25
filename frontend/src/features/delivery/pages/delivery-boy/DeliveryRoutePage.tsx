import { useEffect, useState } from "react";
import { deliveryApi } from "../../api/deliveryApi";
import type { ResourceRow } from "../../../../shared/types/api";

export default function DeliveryRoutePage() {
  const [deliveries, setDeliveries] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await deliveryApi.myDeliveries();
        setDeliveries(response ?? []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const activeDeliveries = deliveries.filter((delivery) => {
    const status = String(
      delivery.Status ?? delivery.status ?? "",
    ).toUpperCase();

    return !["DELIVERED", "RETURNED", "FAILED"].includes(status);
  });

  return (
    <div className="db-page">
      <div className="db-page-heading">
        <div>
          <span className="db-eyebrow">TODAY</span>
          <h2>Today's Route</h2>
          <p>Your assigned delivery stops for today.</p>
        </div>
      </div>

      <div className="db-route-layout">
        <div className="db-card db-map-card">
          <div className="db-card-header">
            <div>
              <h3>Delivery Route</h3>
              <p>{activeDeliveries.length} active stops</p>
            </div>
          </div>

          <div className="db-map">
            <div className="db-map-road db-map-road-one" />
            <div className="db-map-road db-map-road-two" />

            <div className="db-map-pin db-map-pin-one">1</div>
            <div className="db-map-pin db-map-pin-two">2</div>
            <div className="db-map-pin db-map-pin-three">3</div>

            <div className="db-map-current">
              <span />
              Your location
            </div>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div>
              <h3>Route Stops</h3>
              <p>Your delivery sequence</p>
            </div>
          </div>

          {loading ? (
            <div className="db-empty">Loading route...</div>
          ) : activeDeliveries.length === 0 ? (
            <div className="db-empty">
              <strong>No active stops</strong>
              <span>Your route is currently clear.</span>
            </div>
          ) : (
            <div className="db-route-stops">
              {activeDeliveries.map((delivery, index) => {
                const id = String(
                    delivery.Id ?? delivery.id ?? index,
                    );

                    const orderId = String(
                    delivery.OrderId ?? delivery.orderId ?? "-",
                    );

                return (
                  <div className="db-route-stop" key={String(id)}>
                    <div className="db-stop-number">
                      {index + 1}
                    </div>

                    <div className="db-stop-content">
                      <strong>Order #{orderId}</strong>
                      <span>Delivery #{id}</span>
                    </div>

                    <button
                      type="button"
                      className="db-button db-button-secondary"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `Order ${orderId}`,
                          )}`,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      Directions
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}