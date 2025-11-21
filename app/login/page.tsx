'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  // --- State for Login Form ---
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // --- State for Register Form ---
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerSamarkan, setRegisterSamarkan] = useState(false) // Tetap ada di UI meski API mungkin ignore
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)

  // --- Handlers ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoginLoading(true)
    setLoginError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal')
      }

      // Login berhasil
      // Cek role untuk redirect
      if (data.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push(redirectUrl)
      }
      router.refresh() 
    } catch (error: any) {
      setLoginError(error.message)
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegisterLoading(true)
    setRegisterError(null)
    setRegisterSuccess(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          phone: registerPhone,
          password: registerPassword,
          samarkanNama: registerSamarkan,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Registrasi gagal')
      }

      // Registrasi berhasil
      setRegisterSuccess(
        'Registrasi berhasil! Silakan login dengan email atau nomor telepon Anda.'
      )
      // Reset form
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPhone('')
      setRegisterPassword('')
      setRegisterSamarkan(false)
      
      // Pindah ke tab login setelah delay singkat
      setTimeout(() => {
          setAuthMode('login')
          setRegisterSuccess(null)
      }, 2000)
      
    } catch (error: any) {
      setRegisterError(error.message)
    } finally {
      setIsRegisterLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* === LEFT COLUMN: IMAGE === */}
        <div className="relative hidden w-1/2 bg-blue-50 md:block">
          <Image
            src="/login.jpg"
            alt="Donation illustration"
            fill
            style={{ objectFit: 'cover' }}
            priority
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/600x800?text=Donasi'
              e.currentTarget.srcset = ''
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 p-8 text-white flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4">Bergabunglah dalam Kebaikan</h1>
            <p className="text-lg">Kontribusi Anda membuat perbedaan nyata bagi mereka yang membutuhkan.</p>
          </div>
        </div>

        {/* === RIGHT COLUMN: FORM === */}
        <div className="w-full p-8 md:w-1/2 md:p-12 overflow-y-auto max-h-screen">
          {/* === LOGIN FORM === */}
          {authMode === 'login' && (
            <>
              <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
                Selamat Datang Kembali!
              </h2>
              {registerSuccess && (
                <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-center text-sm text-green-700">
                  {registerSuccess}
                </div>
              )}
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email atau Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="contoh@email.com atau 0812..."
                    required
                    disabled={isLoginLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                    disabled={isLoginLoading}
                  />
                </div>

                {loginError && (
                  <div className="rounded-md border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-blue-600 py-3 font-bold text-white transition duration-300 ease-in-out hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-300"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? 'Loading...' : 'Masuk'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Belum punya akun?{' '}
                <button
                  onClick={() => {
                    setAuthMode('register')
                    setLoginError(null)
                  }}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Daftar di sini
                </button>
              </p>
            </>
          )}

          {/* === REGISTER FORM === */}
          {authMode === 'register' && (
            <>
              <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
                Buat Akun Baru
              </h2>
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nama Anda"
                    required
                    disabled={isRegisterLoading}
                  />
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      id="register-samarkan"
                      checked={registerSamarkan}
                      onChange={(e) => setRegisterSamarkan(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isRegisterLoading}
                    />
                    <label htmlFor="register-samarkan" className="ml-2 text-sm text-gray-600">
                      Samarkan nama saya secara default
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="nama@email.com"
                    required
                    disabled={isRegisterLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="08123456789"
                    required
                    disabled={isRegisterLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                    disabled={isRegisterLoading}
                  />
                </div>

                {registerError && (
                  <div className="rounded-md border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
                    {registerError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-blue-600 py-3 font-bold text-white transition duration-300 ease-in-out hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-300"
                  disabled={isRegisterLoading}
                >
                  {isRegisterLoading ? 'Loading...' : 'Daftar'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Sudah punya akun?{' '}
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setRegisterError(null)
                  }}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}