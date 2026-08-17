"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user } = useAuth();
  const { t } = useTranslation();
  
  useEffect(() => {
    if (user) {
      router.push("/discover");
    }
  }, [user, router]);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas.");
        }
        await signUpWithEmail(email, password, displayName);
      }
      router.push("/discover");
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Note: we don't push to /discover here because signInWithGoogle now uses redirect.
      // The useEffect above will handle the redirect when the user state updates.
    } catch (err: any) {
      setError(err.message || t("common.error"));
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-cream-dark">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading text-terracotta mb-2">Gusto</h1>
          <p className="text-brown">Votre assistant culinaire personnel</p>
        </div>

        <div className="flex mb-6 border-b border-stone/30">
          <button
            className={`flex-1 pb-2 font-medium transition-colors ${
              isLogin ? "text-terracotta border-b-2 border-terracotta" : "text-stone hover:text-charcoal"
            }`}
            onClick={() => setIsLogin(true)}
          >
            {t("auth.login")}
          </button>
          <button
            className={`flex-1 pb-2 font-medium transition-colors ${
              !isLogin ? "text-terracotta border-b-2 border-terracotta" : "text-stone hover:text-charcoal"
            }`}
            onClick={() => setIsLogin(false)}
          >
            {t("auth.signup")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Nom d'affichage"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <Input
            label={t("auth.email")}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t("auth.password")}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isLogin && (
            <Input
              label="Confirmer le mot de passe"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</div>}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {isLogin ? t("auth.login") : t("auth.signup")}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-stone/30"></div>
          <span className="px-3 text-sm text-stone">ou</span>
          <div className="flex-grow border-t border-stone/30"></div>
        </div>

        <Button
          variant="secondary"
          className="w-full bg-white hover:bg-gray-50 text-charcoal border-stone/30"
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          leftIcon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          }
        >
          Continuer avec Google
        </Button>
      </Card>
    </div>
  );
}
