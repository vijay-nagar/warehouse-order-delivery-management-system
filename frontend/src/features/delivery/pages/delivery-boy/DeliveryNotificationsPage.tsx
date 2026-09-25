export default function DeliveryNotificationsPage() {
  return (
    <div className="db-page">
      <div className="db-page-heading">
        <div>
          <span className="db-eyebrow">UPDATES</span>
          <h2>Notifications</h2>
          <p>Important updates related to your deliveries.</p>
        </div>
      </div>

      <div className="db-card">
        <div className="db-notification">
          <div className="db-notification-icon">!</div>

          <div>
            <strong>Delivery updates</strong>
            <p>
              New delivery assignments and delivery status updates
              will appear here.
            </p>
          </div>
        </div>

        <div className="db-notification">
          <div className="db-notification-icon">✓</div>

          <div>
            <strong>Stay updated</strong>
            <p>
              Check this section regularly while you are on duty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}