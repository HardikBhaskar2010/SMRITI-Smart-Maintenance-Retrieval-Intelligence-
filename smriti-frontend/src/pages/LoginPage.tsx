import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    await login(username, password);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(0,201,167,0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%)
      `,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: '400px', margin: '0 24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-stroke)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            SMRITI
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Smart Maintenance Retrieval Intelligence
          </p>
        </div>

        {/* Demo credentials hint */}
        <div style={{
          background: 'rgba(0,201,167,0.08)', border: '1px solid rgba(0,201,167,0.2)',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '24px', fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--accent-teal)' }}>Demo credentials:</strong>
          {' '}admin / smriti2026 · engineer / engineer123 · viewer / viewer123
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-stroke)',
                  borderRadius: '10px', padding: '10px 12px 10px 36px',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter password"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-stroke)',
                  borderRadius: '10px', padding: '10px 12px 10px 36px',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--debt-crit)',
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, var(--accent-teal), #00a087)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontWeight: 600, fontSize: '14px',
              padding: '12px', cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
              marginTop: '4px',
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Phase 2 · ET AI Hackathon 2026
        </p>
      </motion.div>
    </div>
  );
}
