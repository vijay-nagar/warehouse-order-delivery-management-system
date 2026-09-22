import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { setAuth } from "../../../utils/authStorage";
import type { LoginResponse } from "../../../types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname ?? "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post<LoginResponse>("/api/auth/login", {
        username: username.trim(),
        password,
      });

      setAuth(response.data.data.accessToken, response.data.data.user);

      if (!rememberMe) {
        sessionStorage.setItem("warehouse-session", "active");
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Login failed. Please check your username and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-logo">W</div>

          <h1>Warehouse Management</h1>

          <p>
            Manage orders, inventory, warehouse operations and deliveries from
            one centralized platform.
          </p>

          <div className="login-feature-list">
            <div>✓ Order Management</div>
            <div>✓ Inventory Control</div>
            <div>✓ Picking & Packing</div>
            <div>✓ Delivery Tracking</div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-mobile-logo">W</div>

          <div className="login-heading">
            <span>Welcome back</span>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="login-footer">
            Warehouse Order & Delivery Management System
          </div>
        </div>
      </div>
    </div>
  );
}
