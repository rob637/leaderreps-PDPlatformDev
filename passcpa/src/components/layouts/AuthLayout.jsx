import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-600 font-bold text-2xl">CPA</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CPA Review</h1>
          <p className="text-primary-200 mt-1">AI-Powered Exam Preparation</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          © {new Date().getFullYear()} CPA Review. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
