import { useSession } from "../../../auth/hooks/useSession";

export default function DeliveryProfilePage() {
  const user = useSession();

  return (
    <div className="db-page">
      <div className="db-page-heading">
        <div>
          <span className="db-eyebrow">ACCOUNT</span>
          <h2>My Profile</h2>
          <p>View your delivery partner account information.</p>
        </div>
      </div>

      <div className="db-profile-grid">
        <div className="db-card db-profile-card">
          <div className="db-profile-avatar">
            {user?.username?.charAt(0).toUpperCase() || "D"}
          </div>

          <h3>{user?.username || "Delivery Partner"}</h3>
          <span className="db-profile-role">Delivery Boy</span>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div>
              <h3>Account Information</h3>
              <p>Your registered account details.</p>
            </div>
          </div>

          <div className="db-profile-fields">
            <div>
              <span>Username</span>
              <strong>{user?.username || "-"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{user?.email || "-"}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong>Delivery Boy</strong>
            </div>

            <div>
              <span>Account Status</span>
              <strong className="db-active-text">
                Active
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}