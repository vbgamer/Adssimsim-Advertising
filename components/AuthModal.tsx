import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Use environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Missing Supabase environment variables. Please check Render Environment Settings."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthModal: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white shadow-lg rounded-2xl w-96 mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔐 Login / Sign Up</h2>

      {success ? (
        <p className="text-green-600">✅ You are successfully logged in!</p>
      ) : (
        <>
          <input
            type="email"
            placeholder="Email"
            className="border rounded-md p-2 w-full mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded-md p-2 w-full mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthModal;
