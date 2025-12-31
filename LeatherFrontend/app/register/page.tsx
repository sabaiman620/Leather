'use client'

import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  return (
    <>
      <Header />
      <main className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="border border-border p-8">
            <h1 className="text-3xl font-serif font-light tracking-wide mb-8 text-center">
              Create Account
            </h1>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault()
                setLoading(true)
                setError(null)
                try {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      const phoneRegex = /^\+?[0-9]{10,15}$/
                      if (!emailRegex.test(email)) {
                        throw new Error('Please enter a valid email address')
                      }
                      if (!phoneRegex.test(phone)) {
                        throw new Error('Please enter a valid phone number (10–15 digits)')
                      }
                      if (password.length < 6) {
                        throw new Error('Password must be at least 6 characters')
                      }
                      if (password !== confirm) {
                        throw new Error('Passwords do not match')
                      }
                      await apiFetch('/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userName: name,
    userEmail: email,
    userPassword: password,
    phoneNumber: phone
  })
})

                  alert('Registered! Check your email to verify.')
                  window.location.href = '/login'
                } catch (err: any) {
                  setError(err?.message || 'Registration failed')
                } finally {
                  setLoading(false)
                }
              }}
            >
              <div>
                <label className="block text-sm font-light mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition"
                  placeholder="+923001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition pr-20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-light mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-accent transition pr-20"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center text-sm mt-6">
              <p className="opacity-60">
                Already have an account?{' '}
                <Link href="/login" className="text-accent hover:opacity-75">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
