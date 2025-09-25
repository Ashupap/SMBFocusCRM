import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for stored tokens and user on initialization
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        queryClient.setQueryData(["/api/auth/user"], user);
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      }
    }
    setIsInitialized(true);
  }, [queryClient]);

  const { data: user, isLoading: isQueryLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No access token");
      }
      
      // Make request with token
      return await apiRequest("GET", "/api/auth/user");
    },
    retry: (failureCount, error: any) => {
      // Don't retry if unauthorized
      if (error?.message?.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: isInitialized && !!localStorage.getItem("access_token"),
  });

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    queryClient.clear();
    window.location.href = "/auth/login";
  };

  return {
    user,
    isLoading: !isInitialized || isQueryLoading,
    isAuthenticated: !!user,
    logout,
  };
}
