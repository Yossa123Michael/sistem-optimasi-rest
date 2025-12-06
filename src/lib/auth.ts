import { User } from './types'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

export function generateTrackingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `PKG${timestamp}${random}`
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function hashPassword(password: string): string {
  return btoa(password)
}

export function verifyPassword(password: string, hash: string): boolean {
  return btoa(password) === hash
}
