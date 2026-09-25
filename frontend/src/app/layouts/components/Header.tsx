import { useNavigate } from "react-router-dom";
import { clearAuth, getStoredUser } from "../../../features/auth/storage/authStorage";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button type="button" className="mobile-menu-button" aria-label="Open navigation" onClick={onMenuClick}>☰</button>
        <div className="header-title"><h1>Warehouse Order & Delivery Management System</h1></div>
      </div>
      <div className="header-user">
        <div className="header-user-info"><strong>{user?.username ?? "User"}</strong><small>{user?.roles?.join(", ") ?? "User"}</small></div>
        <button type="button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
