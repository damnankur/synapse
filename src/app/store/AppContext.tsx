import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import confetti from 'canvas-confetti';
import { User, Project, ActiveProject, Toast, TabType, ToastVariant } from '../types';
import { INITIAL_USER, INITIAL_PROJECTS, INITIAL_ACTIVE_PROJECT } from '../data/mockData';

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

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_TAB'; tab: TabType }
  | { type: 'SET_LOADING_PROJECT'; projectId: string; loading: boolean }
  | { type: 'APPLY_TO_PROJECT'; projectId: string }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_USER_PROFILE'; user: User }
  | { type: 'COMPLETE_MY_ROLE' }
  | { type: 'UPDATE_TOKENS'; delta: number }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_PUBLISHING'; value: boolean };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

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
        user: { ...state.user, tokens: state.user.tokens - 10 },
        projects: state.projects.map((p) =>
          p.id === action.projectId ? { ...p, applicants: p.applicants + 1 } : p
        ),
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.project, ...state.projects],
        user: { ...state.user, tokens: state.user.tokens - 10 },
      };

    case 'UPDATE_USER_PROFILE':
      return {
        ...state,
        user: action.user,
      };

    case 'COMPLETE_MY_ROLE':
      return {
        ...state,
        user: { ...state.user, tokens: state.user.tokens + 30 },
        activeProject: {
          ...state.activeProject,
          myTaskCompleted: true,
          progress: Math.min(state.activeProject.progress + 20, 100),
          milestones: state.activeProject.milestones.map((m, i) =>
            i === 3 ? { ...m, completed: true } : m
          ),
        },
      };

    case 'UPDATE_TOKENS':
      return {
        ...state,
        user: { ...state.user, tokens: Math.max(0, state.user.tokens + action.delta) },
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
  setTab: (tab: TabType) => void;
  updateUserProfile: (user: User) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: INITIAL_USER,
    projects: INITIAL_PROJECTS,
    appliedProjectIds: [],
    loadingProjectIds: [],
    activeTab: 'feed',
    activeProject: INITIAL_ACTIVE_PROJECT,
    toasts: [],
    isPublishing: false,
  });

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

  const setTab = useCallback((tab: TabType) => {
    dispatch({ type: 'SET_TAB', tab });
  }, []);

  const updateUserProfile = useCallback(
    (user: User) => {
      dispatch({ type: 'UPDATE_USER_PROFILE', user });
      addToast('success', 'Profile Updated', 'Your profile details were saved successfully.');
    },
    [addToast]
  );

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

      // Simulate network delay
      await new Promise((res) => setTimeout(res, 1400));

      dispatch({ type: 'SET_LOADING_PROJECT', projectId, loading: false });
      dispatch({ type: 'APPLY_TO_PROJECT', projectId });

      const project = state.projects.find((p) => p.id === projectId);
      addToast(
        'success',
        'Application Submitted!',
        `You applied to "${project?.title ?? 'project'}". Your commitment is noted.`,
        -10
      );
    },
    [state.user.tokens, state.appliedProjectIds, state.projects, addToast]
  );

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
        return;
      }

      dispatch({ type: 'SET_PUBLISHING', value: true });
      await new Promise((res) => setTimeout(res, 1600));
      dispatch({ type: 'SET_PUBLISHING', value: false });

      const newProject: Project = {
        id: `proj-user-${Date.now()}`,
        title: data.title,
        domain: data.domain,
        description: data.description,
        requiredRoles: data.requiredRoles,
        status: 'open',
        creator: state.user.name,
        creatorRole: state.user.role,
        costToApply: 10,
        applicants: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: data.tags,
        maxTeamSize: data.requiredRoles.length + 1,
        featured: false,
      };

      dispatch({ type: 'ADD_PROJECT', project: newProject });
      addToast(
        'success',
        'Project Published!',
        `"${data.title}" is now live in the feed. Researchers can apply.`,
        -10
      );
    },
    [state.user.tokens, state.user.name, state.user.role, addToast]
  );

  const purchaseTokens = useCallback(
    async (amount: number) => {
      // Simulate backend payment intent creation
      await new Promise((res) => setTimeout(res, 600));

      // Simulate payment capture/confirmation
      await new Promise((res) => setTimeout(res, 900));

      dispatch({ type: 'UPDATE_TOKENS', delta: amount });
      addToast(
        'success',
        'Tokens Added',
        `Payment confirmed. ${amount} tokens have been added to your balance.`,
        amount
      );
    },
    [addToast]
  );

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

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setTab,
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

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
