import axios from 'axios'

export const AUTH_TOKEN_KEY = 'yugihub_token'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    return
  }

  delete api.defaults.headers.common.Authorization
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function restoreAuthToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  }
  return token
}