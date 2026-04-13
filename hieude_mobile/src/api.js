import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

const STORAGE_KEY = 'marksense_user';

// ─── Auth helpers ───
export async function getStoredUser() {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    if (val) {
      const user = JSON.parse(val);
      if (!user.token) { await AsyncStorage.removeItem(STORAGE_KEY); return null; }
      return user;
    }
  } catch (e) {}
  return null;
}

export async function storeUser(user) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch (e) {}
}

export async function clearUser() {
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function authHeaders(token) {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ─── API calls ───

export async function apiLogin(username, password) {
  const resp = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return resp.json();
}

export async function apiRegister(username, password) {
  const resp = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return resp.json();
}

export async function apiSocialLogin(email, name, provider) {
  const resp = await fetch(`${BASE_URL}/social-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, provider }),
  });
  return resp.json();
}

export async function apiOcr(imageUri, token) {
  const formData = new FormData();
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1] || 'jpg';
  formData.append('file', { uri: imageUri, name: `photo.${fileType}`, type: `image/${fileType}` });

  const resp = await fetch(`${BASE_URL}/ocr`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  const status = resp.status;
  const data = await resp.json();
  return { status, data };
}

export async function apiGetHistory(token) {
  const resp = await fetch(`${BASE_URL}/history`, { headers: authHeaders(token) });
  return resp.json();
}

export async function apiGetLibrary() {
  const resp = await fetch(`${BASE_URL}/api/library`);
  return resp.json();
}

export async function apiGetCredits(token) {
  const resp = await fetch(`${BASE_URL}/api/credits`, { headers: authHeaders(token) });
  return resp.json();
}

export async function apiCreatePayment(packageId, token) {
  const resp = await fetch(`${BASE_URL}/api/v1/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ package: packageId }),
  });
  return resp.json();
}

export async function apiCheckPaymentStatus(paymentId) {
  const resp = await fetch(`${BASE_URL}/api/v1/payment/status/${paymentId}`);
  return resp.json();
}

export async function apiMockPayment(paymentId, token) {
  const resp = await fetch(`${BASE_URL}/api/v1/payment/mock/${paymentId}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return resp.json();
}
