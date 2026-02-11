// storage.js

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

/**
 * Save user & token
 */
export const saveUserData = (user, token) => {
    console.log("token:::",token);
    console.log("user:::",user);
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Get user object
 */
export const getUserData = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Get JWT token
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Clear user & token (logout)
 */
export const clearUserData = () => {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};
