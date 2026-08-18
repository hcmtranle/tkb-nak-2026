import React, { useState } from 'react';
import { Lock, Eye, EyeOff, BookOpen } from 'lucide-react';

interface LoginScreenProps {
  onAdminLogin: () => void;
  onTeacherLogin: () => void;
}

const ADMIN_PASSWORD = 'Tram@0211';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAdminLogin, onTeacherLogin }) => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'choose' | 'admin'>('choose');

  const handleAdminSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setError('');
      onAdminLogin();
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-700">
      {/* Logo / Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <p className="text-blue-200 text-sm font-medium uppercase tracking-widest">Uỷ ban nhân dân phường Đông Hưng Thuận</p>
        <h1 className="text-white text-2xl font-bold mt-1">Trường TH Nguyễn An Khương</h1>
        <p className="text-blue-200 mt-1">Hệ thống Thời Khoá Biểu 2026-2027</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {mode === 'choose' ? (
          <div className="p-8 space-y-4">
            <h2 className="text-center text-xl font-bold text-slate-800 mb-6">Chọn vai trò</h2>
            <button
              onClick={() => setMode('admin')}
              className="w-full flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-5 rounded-xl transition-all shadow"
            >
              <Lock className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <div className="text-base">Quản trị viên</div>
                <div className="text-xs text-indigo-200 font-normal">Toàn quyền — yêu cầu mật khẩu</div>
              </div>
            </button>
            <button
              onClick={onTeacherLogin}
              className="w-full flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 px-5 rounded-xl transition-all shadow"
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <div className="text-base">Giáo viên / Phụ huynh</div>
                <div className="text-xs text-emerald-100 font-normal">Chỉ xem & in thời khoá biểu</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="p-8">
            <button onClick={() => { setMode('choose'); setError(''); setPassword(''); }} className="text-slate-400 hover:text-slate-600 text-sm mb-4 flex items-center gap-1">
              ← Quay lại
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-5">Đăng nhập Quản trị</h2>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Mật khẩu</label>
            <div className="relative mb-1">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAdminSubmit()}
                placeholder="Nhập mật khẩu quản trị..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
              <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button
              onClick={handleAdminSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl mt-3 transition-all shadow"
            >
              Đăng nhập
            </button>
          </div>
        )}
      </div>

      <p className="text-blue-300 text-xs mt-6">© 2026-2027 Trường TH Nguyễn An Khương</p>
    </div>
  );
};
