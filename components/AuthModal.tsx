import React, { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { Role, UserGender } from "../types";
import { Country, State, City } from "country-state-city";
import type { ICountry, IState, ICity } from "country-state-city";
import { supabase } from "../supabaseClient";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  initialRole: Role | null;
}

type AuthView =
  | "auth"
  | "forgot_password"
  | "forgot_password_success"
  | "signup_success";

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  initialRole,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<UserGender | "">("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>("auth");

  // Country/State/City dropdown data
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    if (isOpen) {
      setUsername("");
      setEmail("");
      setPassword("");
      setGender("");
      setCity("");
      setState("");
      setCountry("");
      setSelectedCountry("");
      setSelectedState("");
      setStates([]);
      setCities([]);
      setError("");
      setIsLoading(false);
      setView("auth");
    }
  }, [isOpen]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const countryData = Country.getCountryByCode(selectedCountry);
      setCountry(countryData?.name || "");
      setStates(State.getStatesOfCountry(selectedCountry));
      setSelectedState("");
      setState("");
      setCities([]);
      setCity("");
    } else {
      setCountry("");
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateData = State.getStateByCodeAndCountry(
        selectedState,
        selectedCountry
      );
      setState(stateData?.name || "");
      setCities(City.getCitiesOfState(selectedCountry, selectedState));
      setCity("");
    } else {
      setState("");
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

  // -------------------------------
  // LOGIN + AUTO SIGN UP LOGIC
  // -------------------------------
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialRole) return;

    const isViewer = initialRole === "viewer";

    if (!username || !email || !password || !city || !state || !country) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isViewer && !gender) {
      setError("Please select a gender.");
      return;
    }

    setIsLoading(true);
    setError("");

    // ---- LOGIN FIRST ----
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!loginError) {
      onLogin();
      setIsLoading(false);
      return;
    }

    // ---- LOGIN FAILED → CREATE ACCOUNT ----
    try {
      const metadata: any = {
        username,
        role: initialRole,
        city,
        state,
        country,
      };

      if (isViewer) metadata.gender = gender;

      if (initialRole === "advertiser") {
        metadata.subscribers = Math.floor(Math.random() * 50000) + 1000;
        metadata.banner_url = `https://picsum.photos/seed/${encodeURIComponent(
          username
        )}banner/1200/400`;
        metadata.logo_url = `https://picsum.photos/seed/${encodeURIComponent(
          username
        )}logo/200`;
        metadata.credit_balance = 500;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setView("signup_success");
      }
    } catch (err: any) {
      setError("Signup failed. Please try again.");
    }

    setIsLoading(false);
  };

  // -------------------------------
  // PASSWORD RESET
  // -------------------------------
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setIsLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin,
      }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setView("forgot_password_success");
    }

    setIsLoading(false);
  };

  if (!initialRole) return null;

  // -------------------------------
  // UI RENDER LOGIC
  // -------------------------------
  const renderContent = () => {
    switch (view) {
      case "signup_success":
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-accent-500">
              Account Created!
            </h3>
            <p className="mt-2 text-gray-300">
              Your account has been created. You may now log in.
            </p>
            <div className="mt-6">
              <Button onClick={() => setView("auth")}>Back to Login</Button>
            </div>
          </div>
        );

      case "forgot_password_success":
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-accent-500">
              Check Your Email
            </h3>
            <p className="mt-2 text-gray-300">
              If an account exists, a reset link has been sent.
            </p>
            <div className="mt-6">
              <Button onClick={() => setView("auth")}>Back to Login</Button>
            </div>
          </div>
        );

      case "forgot_password":
        return (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                required
                placeholder="Enter your email"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                className="text-sm text-primary-500 hover:underline"
                onClick={() => setView("auth")}
              >
                Back to Login
              </button>
              <Button type="submit" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </div>
          </form>
        );

      default:
      case "auth":
        return (
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                {initialRole === "advertiser" ? "Company Name" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setView("forgot_password")}
                  className="text-xs text-primary-500 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                required
              />
            </div>

            {/* Gender (only for viewer) */}
            {initialRole === "viewer" && (
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as UserGender)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  required
                >
                  <option value="" disabled>
                    Select your gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Location
              </label>

              <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Country */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  required
                >
                  <option value="" disabled>
                    Select Country
                  </option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* State */}
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  required
                  disabled={!selectedCountry || states.length === 0}
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* City */}
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  required
                  disabled={!selectedState || cities.length === 0}
                >
                  <option value="" disabled>
                    Select City
                  </option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={isLoading}>
                Login / Sign Up
              </Button>
            </div>
          </form>
        );
    }
  };

  const title =
    initialRole === "advertiser" ? "Company Sign-In" : "Viewer Sign-In";

  const subtitle =
    initialRole === "viewer"
      ? "To gain rewards, please sign in first."
      : "Access your advertiser dashboard.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      {renderContent()}
    </Modal>
  );
};

export default AuthModal;
