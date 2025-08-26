import React, { useState } from "react";
import { Mail, Lock, Building2 } from "lucide-react";
import Input from "../components/Input";
import Button from "../components/Button";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    // TODO: Implement sign-in logic
    // Example: console.log({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8d831870a_HWLogo.png"
              alt="Hamiltonwise Logo"
              className="w-12 h-12 object-contain"
            />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">Signals AI</h1>
              <p className="text-sm text-gray-600">
                Practice Vital Signs Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Sign in to your dashboard</p>
          </div>

          {/* Error/Info message with reserved space to prevent layout shift */}
          <div
            id="signin-msg"
            role="alert"
            aria-live="polite"
            className="mb-4 min-h-[20px]"
          ></div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              leftIcon={<Building2 className="w-5 h-5" />}
              variant="primary"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
