// AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import ApiService from "../components/ApiService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);

          setUser(parsedUser);
          setToken(storedToken);
          // Fetch latest user data from API
          await fetchUserData(parsedUser._id);
        }
      } catch (error) {
        console.log("Auth Init Error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);


  // Fetch latest user data
  const fetchUserData = async (userId,) => {
    try {
      const userToken = localStorage.getItem("token");

    const response = await ApiService.get(`/users/getUserById`,{
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(response.data));

        // Update state
        setUser(response.data);

        // Check expiry date
        checkExpiry(response.expiryDate);
      }
    } catch (error) {
      console.log("Fetch User Error:", error);
    }
  };

  // Check expiry
  const checkExpiry = (expiryDate) => {
    if (!expiryDate) {
      setIsExpired(false);
      return;
    }

    const today = new Date();
    const expiry = new Date(expiryDate);

    // Remove time comparison
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    setIsExpired(today > expiry);
  };

  // Logout
  const logout = () => {
    localStorage.clear();

    setUser(null);
    setToken(null);
    setIsExpired(false);
  };

  // Admin check
  const isAdmin = user?.role === "admin";

  const value = {
    user,
    token,
    loading,
    isExpired,
    isAdmin,
    fetchUserData,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}