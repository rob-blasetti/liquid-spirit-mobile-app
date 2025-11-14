import { ENABLE_PASSWORD_VALIDATION } from '../config';

export const isValidEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(String(email).toLowerCase());
};

export const isValidBahaiId = (id) => {
  const bahaiIdRegex = /^\d+$/;
  return bahaiIdRegex.test(id);
};

export const isValidPassword = (password) => {
  if (!ENABLE_PASSWORD_VALIDATION) return true;
  // Minimum eight characters, at least one letter and one number; special characters allowed
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};
