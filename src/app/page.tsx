"use client";

import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);

  const renderContent = () => {
    if (isLogin) {
      return (
        <>
          <LoginForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  アカウントをお持ちでない場合
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setIsLogin(false)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50"
              >
                新規登録（招待コードが必要です）
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <RegisterForm />
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                すでにアカウントをお持ちの場合
              </span>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setIsLogin(true)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50"
            >
              ログイン
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Goshinkai - 伍心会
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Management Community
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {renderContent()}
        </Card>
      </div>
    </div>
  );
}
