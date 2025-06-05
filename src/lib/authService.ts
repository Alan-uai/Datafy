import type { User } from '@/types';

export interface LoginCredentials {
  email: string;
  password?: string; // Password might not be strictly checked in mock
}

export interface SignupCredentials extends LoginCredentials {
  name?: string;
  role?: string;
}

const USER_STORAGE_KEY = 'dashify_user';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const loginUser = async (credentials: LoginCredentials): Promise<User> => {
  await delay(500);
  // In a real app, you'd call an API. Here, we mock it.
  // For demo, allow login if email is provided.
  if (!credentials.email) {
    throw new Error('Email is required.');
  }

  // Check if user exists in localStorage (e.g. from a previous signup)
  const storedUsersString = typeof window !== 'undefined' ? localStorage.getItem('dashify_users') : null;
  const storedUsers: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];
  const existingUser = storedUsers.find(u => u.email === credentials.email);

  let user: User;
  if (existingUser) {
    user = existingUser;
  } else {
    // If user doesn't exist, create a new one for demo purposes
    user = {
      id: Date.now().toString(),
      email: credentials.email,
      name: credentials.email.split('@')[0], // Simple name generation
      role: 'Analyst', // Default role
    };
     // Add this new demo user to our "database"
    storedUsers.push(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashify_users', JSON.stringify(storedUsers));
    }
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
  return user;
};

export const signupUser = async (credentials: SignupCredentials): Promise<User> => {
  await delay(500);
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required for signup.');
  }

  const storedUsersString = typeof window !== 'undefined' ? localStorage.getItem('dashify_users') : null;
  const storedUsers: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];

  if (storedUsers.find(u => u.email === credentials.email)) {
    throw new Error('User with this email already exists.');
  }

  const newUser: User = {
    id: Date.now().toString(),
    email: credentials.email,
    name: credentials.name || credentials.email.split('@')[0],
    role: credentials.role || 'User', // Default role or from signup
  };
  
  storedUsers.push(newUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashify_users', JSON.stringify(storedUsers));
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  }
  return newUser;
};

export const logoutUser = async (): Promise<void> => {
  await delay(200);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  await delay(100); // Simulate async check
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
      return JSON.parse(userJson) as User;
    }
  }
  return null;
};
