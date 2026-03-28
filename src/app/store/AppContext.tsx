import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import confetti from 'canvas-confetti';
import { User, Project, ActiveProject, Toast, TabType, ToastVariant } from '../types';
import { INITIAL_USER, INITIAL_PROJECTS, INITIAL_ACTIVE_PROJECT } from '../data/mockData';
import { updateCurrentUserProfile } from '../services/user';
import {
  applyToProject as applyToProjectApi,
  createProject as createProjectApi,
} from '../services/projects';

// ─── State ───────────────────────────────────────────────────────────────────

interface AppState {
  user: User;
  projects: Project[];
  appliedProjectIds: string[];
  loadingProjectIds: string[];
  activeTab: TabType;
  activeProject: ActiveProject;
  toasts: Toast[];
  isPublishing: boolean;
}

const TAB_PATHS: Record<TabType, string> = {
  feed: '/feed',
  dashboard: '/dashboard',
  post: '/post',
  tokens: '/tokens',
  user: '/user',
  publisher: '/publisher/projects',
};

const PATH_TO_TAB: Record<string, TabType> = {
  '/': 'feed',
  '/feed': 'feed',
  '/dashboard': 'dashboard',
  '/post': 'post',
  '/tokens': 'tokens',
  '/user': 'user',
  '/publisher/projects': 'publisher',
};

function getTabFromPath(pathname: string): TabType {
  return PATH_TO_TAB[pathname.toLowerCase()] ?? 'feed';
}

function getInitialTab(): TabType {
  if (typeof window === 'undefined') return 'feed';
  return getTabFromPath(window.location.pathname);
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_TAB'; tab: TabType }
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'SET_LOADING_PROJECT'; projectId: string; loading: boolean }
  | { type: 'APPLY_TO_PROJECT'; projectId: string }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'HYDRATE_USER'; user: User }
  | { type: 'UPDATE_USER_PROFILE'; user: User }
  | { type: 'COMPLETE_MY_ROLE' }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_PUBLISHING'; value: boolean };

function deriveInitials(name: string): string {
  const letters = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return letters || 'U';
}

function normalizeUser(rawUser: Partial<User> | undefined): User {
  const name = String(rawUser?.name || INITIAL_USER.name).trim();

  const tokens = Number(rawUser?.tokens);
  const completedProjects = Number(rawUser?.completedProjects);

  return {
    ...INITIAL_USER,
    ...rawUser,
    id: String(rawUser?.id || INITIAL_USER.id).trim(),
    name,
    email: String(rawUser?.email || INITIAL_USER.email).trim().toLowerCase(),
    phone: String(rawUser?.phone || INITIAL_USER.phone).trim(),
    isEmailVisible:
      typeof rawUser?.isEmailVisible === 'boolean'
        ? rawUser.isEmailVisible
        : INITIAL_USER.isEmailVisible,
    isPhoneVisible:
      typeof rawUser?.isPhoneVisible === 'boolean'
        ? rawUser.isPhoneVisible
        : INITIAL_USER.isPhoneVisible,
    role: String(rawUser?.role || INITIAL_USER.role).trim(),
    initials: String(rawUser?.initials || deriveInitials(name))
      .trim()
      .toUpperCase()
      .slice(0, 4),
    tokens: Number.isFinite(tokens) ? Math.max(0, Math.round(tokens)) : INITIAL_USER.tokens,
    university: String(rawUser?.university || INITIAL_USER.university).trim(),
    department: String(rawUser?.department || INITIAL_USER.department).trim(),
    bio: String(rawUser?.bio || INITIAL_USER.bio).trim(),
    skills: Array.isArray(rawUser?.skills)
      ? rawUser.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : INITIAL_USER.skills,
    completedProjects: Number.isFinite(completedProjects)
      ? Math.max(0, Math.round(completedProjects))
      : INITIAL_USER.completedProjects,
    joinDate: String(rawUser?.joinDate || INITIAL_USER.joinDate).trim(),
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

// Central state transition function for all app actions.
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_PROJECTS':
      return { ...state, projects: action.projects };

    case 'SET_LOADING_PROJECT':
      return {
        ...state,
        loadingProjectIds: action.loading
          ? [...state.loadingProjectIds, action.projectId]
          : state.loadingProjectIds.filter((id) => id !== action.projectId),
      };

    case 'APPLY_TO_PROJECT':
      return {
        ...state,
        appliedProjectIds: [...state.appliedProjectIds, action.projectId],
        projects: state.projects.map((p) =>
          p.id === action.projectId ? { ...p, applicants: p.applicants + 1 } : p
        ),
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.project, ...state.projects],
      };

    case 'HYDRATE_USER':
      return {
        ...state,
        user: action.user,
      };

    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        user: action.user,
      };

    case 'COMPLETE_MY_ROLE':
      return {
        ...state,
        activeProject: {
          ...state.activeProject,
          myTaskCompleted: true,
          progress: Math.min(state.activeProject.progress + 20, 100),
          milestones: state.activeProject.milestones.map((m, i) =>
            i === 3 ? { ...m, completed: true } : m
          ),
        },
      };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case 'SET_PUBLISHING':
      return { ...state, isPublishing: action.value };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextType extends AppState {
  setTab: (tab: TabType, options?: { replaceHistory?: boolean }) => void;
  setProjects: (projects: Project[]) => void;
  hydrateUser: (user: Partial<User>) => void;
  updateUserBio: (bio: string) => Promise<void>;
  updateUserProfile: (user: User) => Promise<void>;
  applyToProject: (projectId: string) => Promise<void>;
  publishProject: (data: {
    title: string;
    domain: string;
    requiredRoles: string[];
    description: string;
    tags: string[];
  }) => Promise<void>;
  completeMyRole: () => void;
  purchaseTokens: (amount: number) => Promise<void>;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Toast helper ─────────────────────────────────────────────────────────────

let toastIdCounter = 0;

// ─── Provider ────────────────────────────────────────────────────────────────

// Provides global app state and action handlers to the component tree.
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: INITIAL_USER,
    projects: INITIAL_PROJECTS,
    appliedProjectIds: [],
    loadingProjectIds: [],
    activeTab: getInitialTab(),
    activeProject: INITIAL_ACTIVE_PROJECT,
    toasts: [],
    isPublishing: false,
  });

  // Creates a toast, queues it in state, and auto-removes it after a duration.
  const addToast = useCallback(
    (
      variant: ToastVariant,
      title: string,
      message: string,
      tokenDelta?: number,
      duration = 4000
    ) => {
      const id = `toast-${++toastIdCounter}`;
      dispatch({ type: 'ADD_TOAST', toast: { id, variant, title, message, tokenDelta } });
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), duration);
    },
    []
  );

  // Switches the active app tab (feed, dashboard, post, etc).
  const setTab = useCallback((tab: TabType, options?: { replaceHistory?: boolean }) => {
    if (typeof window !== 'undefined') {
      const targetPath = TAB_PATHS[tab];
      if (window.location.pathname !== targetPath) {
        if (options?.replaceHistory) {
          window.history.replaceState({}, '', targetPath);
        } else {
          window.history.pushState({}, '', targetPath);
        }
      }
    }
    dispatch({ type: 'SET_TAB', tab });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      dispatch({ type: 'SET_TAB', tab: getTabFromPath(window.location.pathname) });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const setProjects = useCallback((projects: Project[]) => {
    dispatch({ type: 'SET_PROJECTS', projects });
  }, []);

  // Hydrates the app user state from session/backend payloads.
  const hydrateUser = useCallback((user: Partial<User>) => {
    dispatch({ type: 'HYDRATE_USER', user: normalizeUser(user) });
  }, []);

  // Saves updated user profile values into global state and confirms via toast.
  const updateUserBio = useCallback(async (bio: string) => {
    const result = await updateCurrentUserProfile({ bio });
    dispatch({ type: 'UPDATE_USER_PROFILE', user: normalizeUser(result.user) });
  }, []);

  // Saves updated user profile values into global state and confirms via toast.
  const updateUserProfile = useCallback(
    async (user: User) => {
      try {
        const payload = normalizeUser(user);
        const result = await updateCurrentUserProfile(payload);
        dispatch({ type: 'UPDATE_USER_PROFILE', user: normalizeUser(result.user) });
        addToast('success', 'Profile Updated', 'Your profile details were saved successfully.');
      } catch (error) {
        addToast(
          'error',
          'Profile Update Failed',
          error instanceof Error ? error.message : 'Unable to save profile right now.'
        );
        throw error;
      }
    },
    [addToast]
  );

  // Applies current user to a project after token and duplicate checks.
  const applyToProject = useCallback(
    async (projectId: string) => {
      // Get the current state inline to check tokens at call time
      // We use a ref-like approach through the dispatch pattern
      if (state.user.tokens < 10) {
        addToast(
          'error',
          'Insufficient Tokens',
          'You need at least 10 tokens to apply to a project.',
          undefined,
          5000
        );
        return;
      }

      if (state.appliedProjectIds.includes(projectId)) return;

      dispatch({ type: 'SET_LOADING_PROJECT', projectId, loading: true });
      try {
        const response = await applyToProjectApi(projectId);
        dispatch({ type: 'APPLY_TO_PROJECT', projectId });
        dispatch({ type: 'UPDATE_USER_PROFILE', user: normalizeUser(response.user) });
        addToast(
          'success',
          'Application Submitted!',
          `You applied to "${response.project?.title ?? 'project'}". Awaiting publisher selection.`,
          response.tokenDelta
        );
      } catch (error) {
        addToast(
          'error',
          'Application Failed',
          error instanceof Error ? error.message : 'Unable to apply right now.'
        );
      } finally {
        dispatch({ type: 'SET_LOADING_PROJECT', projectId, loading: false });
      }
    },
    [state.user.tokens, state.appliedProjectIds, addToast]
  );

  // Publishes a new project after validating token balance, then debits tokens.
  const publishProject = useCallback(
    async (data: {
      title: string;
      domain: string;
      requiredRoles: string[];
      description: string;
      tags: string[];
    }) => {
      if (state.user.tokens < 10) {
        addToast(
          'error',
          'Insufficient Tokens',
          'You need at least 10 tokens to publish a project.',
          undefined,
          5000
        );
        throw new Error('Insufficient tokens.');
      }

      dispatch({ type: 'SET_PUBLISHING', value: true });
      try {
        const response = await createProjectApi(data);
        dispatch({ type: 'ADD_PROJECT', project: response.project });
        dispatch({ type: 'UPDATE_USER_PROFILE', user: normalizeUser(response.user) });
        addToast(
          'success',
          'Project Published!',
          `"${data.title}" is now live in the feed. Researchers can apply.`,
          response.tokenDelta
        );
      } catch (error) {
        addToast(
          'error',
          'Publish Failed',
          error instanceof Error ? error.message : 'Unable to publish project right now.'
        );
        throw error;
      } finally {
        dispatch({ type: 'SET_PUBLISHING', value: false });
      }
    },
    [state.user.tokens, addToast]
  );

  // Simulates checkout flow, persists token update in DB, then hydrates app state.
  const purchaseTokens = useCallback(
    async (amount: number) => {
      // Simulate backend payment intent creation
      await new Promise((res) => setTimeout(res, 600));

      // Simulate payment capture/confirmation
      await new Promise((res) => setTimeout(res, 900));

      const result = await updateCurrentUserProfile({
        tokens: Math.max(0, state.user.tokens + amount),
      });
      dispatch({ type: 'UPDATE_USER_PROFILE', user: normalizeUser(result.user) });
      addToast(
        'success',
        'Tokens Added',
        `Payment confirmed. ${amount} tokens have been added to your balance.`,
        amount
      );
    },
    [state.user.tokens, addToast]
  );

  // Marks the user's role as complete, updates progress, rewards tokens, and celebrates.
  const completeMyRole = useCallback(() => {
    dispatch({ type: 'COMPLETE_MY_ROLE' });

    // Confetti celebration
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#003D7A', '#6B4C9A', '#17A2B8', '#FFD700'],
    });

    addToast(
      'success',
      'Role Complete! 🎉',
      'Commitment refund (+10) and success reward (+20) added to your balance.',
      +30,
      6000
    );
  }, [addToast]);

  // Removes a toast immediately (used by close button and timeout).
  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setTab,
        setProjects,
        hydrateUser,
        updateUserBio,
        updateUserProfile,
        applyToProject,
        publishProject,
        purchaseTokens,
        completeMyRole,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Convenience hook that exposes app state/actions and guards provider usage.
export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
