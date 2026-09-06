export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  provider: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogleCredential: (credential: string) => Promise<boolean>;
  devLogin: (profile: "alex" | "sarah") => Promise<void>;
  logout: () => void;
}
