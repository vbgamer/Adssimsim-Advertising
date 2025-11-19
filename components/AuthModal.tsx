import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Role, UserGender } from '../types';
import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  initialRole: Role | null;
}

type AuthView = 'auth' | 'forgot_password' | 'forgot_password_success' | 'signup_success';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialRole }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>('auth');

  // State for location dropdowns
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(''); // Stores ISO code
  const [selectedState, setSelectedState] = useState(''); // Stores ISO code

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setGender('');
      setCity('');
      setState('');
      setCountry('');
      setSelectedCountry('');
      setSelectedState('');
      setStates([]);
      setCities([]);
      setError('');
      setIsLoading(false);
      setView('auth');
    }
  }, [isOpen]);

  // Effects for populating location dropdowns
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (selectedCountry) {
        const countryData = Country.getCountryByCode(selectedCountry);
        setCountry(countryData?.name || '');
        setStates(State.getStatesOfCountry(selectedCountry));
        setSelectedState('');
        setState('');
        setCities([]);
        setCity('');
    } else {
        setCountry('');
        setStates([]);
        setCities([]);
    }
}, [selectedCountry]);

  useEffect(() => {
      if (selectedCountry && selectedState) {
          const stateData = State.getStateByCodeAndCountry(selectedState, selectedCountry);
          setState(stateData?.name || '');
          setCities(City.getCitiesOfState(selectedCountry, selectedState));
          setCity('');
      } else {
          setState('');
          setCities([]);
      }
  }, [selectedCountry, selectedState]);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isViewer = initialRole === 'viewer';
    const commonFieldsFilled = username && email && password && initialRole && city && state && country;
    const viewerFieldsFilled = isViewer ? !!gender : true;

    if (!commonFieldsFilled || !viewerFieldsFilled) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
        await authService.login({ email, password });
        onLogin();
    } catch (loginError: any) {
        // If login fails (e.g., user not found), try to sign them up.
        try {
            const signUpData: { [key: string]: any } = {
                username,
                email,
                password,
                role: initialRole,
                city,
                state,
                country,
                ...(initialRole === 'advertiser' ? {
                    subscribers: Math.floor(Math.random() * 50000) + 1000,
                    banner_url: `https://picsum.photos/seed/${encodeURIComponent(username)}banner/1200/400`,
                    logo_url: `https://picsum.photos/seed/${encodeURIComponent(username)}logo/200`,
                    credit_balance: 500,
                } : {})
            };
            if (isViewer) {
                signUpData.gender = gender;
            }

            await authService.signup(signUpData);
            setView('signup_success');

        } catch (signUpError: any) {
            setError(signUpError.message || 'Login failed and signup was not possible.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
        await authService.requestPasswordReset(email);
        setView('forgot_password_success');
    } catch (resetError: any) {
        setError(resetError.message || "Failed to send password reset email.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!initialRole) {
    return null;
  }
  
  const renderContent = () => {
    switch(view) {
        case 'signup_success':
            return (
                <div className="text-center">
                    <h3 className="text-xl font-bold text-accent-500">Account Created!</h3>
                    <p className="mt-2 text-gray-300">
                        Your account has been created. You can now log in with your credentials. Some applications may require email verification.
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => setView('auth')}>Back to Login</Button>
                    </div>
                </div>
            );
        case 'forgot_password_success':
            return (
                <div className="text-center">
                    <h3 className="text-xl font-bold text-accent-500">Check Your Email</h3>
                    <p className="mt-2 text-gray-300">
                        If an account with that email exists, we've sent a link to reset your password.
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => setView('auth')}>Back to Login</Button>
                    </div>
                </div>
            );
        case 'forgot_password':
            return (
                 <form onSubmit={handlePasswordReset} className="space-y-6">
                    <div>
                        <label htmlFor="email-reset" className="block text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            type="email"
                            id="email-reset"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            required
                            autoComplete="email"
                            placeholder="Enter your account email"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="pt-4 flex items-center justify-between">
                         <button type="button" onClick={() => { setView('auth'); setError(''); }} className="text-sm text-primary-500 hover:underline">
                            Back to Login
                        </button>
                        <Button type="submit" isLoading={isLoading}>Send Reset Link</Button>
                    </div>
                </form>
            );
        case 'auth':
        default:
            const usernameLabel = initialRole === 'advertiser' ? 'Company Name' : 'Username';
            return (
                <form onSubmit={handleAuth} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300">{usernameLabel}</label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      required
                      autoComplete="username"
                    />
                  </div>
                   <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <button 
                            type="button" 
                            onClick={() => { setView('forgot_password'); setError(''); setPassword(''); }} 
                            className="text-xs text-primary-500 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  {initialRole === 'viewer' && (
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-300">Gender</label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as UserGender)}
                        className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                        required
                      >
                        <option value="" disabled>Select your gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}

                  <div>
                      <label className="block text-sm font-medium text-gray-300">Location</label>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <select
                              value={selectedCountry}
                              onChange={(e) => setSelectedCountry(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 disabled:opacity-50"
                              required
                          >
                              <option value="" disabled>Select Country</option>
                              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                          </select>
                          <select
                              value={selectedState}
                              onChange={(e) => setSelectedState(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 disabled:opacity-50"
                              required
                              disabled={!selectedCountry || states.length === 0}
                          >
                              <option value="" disabled>Select State / Province</option>
                              {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                          </select>
                          <select
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 disabled:opacity-50"
                              required
                              disabled={!selectedState || cities.length === 0}
                          >
                              <option value="" disabled>Select City / District</option>
                              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                      </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    If this is your first time, an account will be created for you with all the details provided.
                  </p>
                  
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" isLoading={isLoading}>Login / Sign Up</Button>
                  </div>
                </form>
            );
    }
  };

  let title = initialRole === 'advertiser' ? 'Company Sign-In' : 'Viewer Sign-In';
  let subtitle = initialRole === 'viewer' ? 'To gain rewards, please sign in first.' : 'Access your advertiser dashboard.';
  
  if (view === 'forgot_password' || view === 'forgot_password_success') {
      title = 'Reset Password';
      subtitle = 'Enter your email to receive a password reset link.';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      {renderContent()}
    </Modal>
  );
};

export default AuthModal;
