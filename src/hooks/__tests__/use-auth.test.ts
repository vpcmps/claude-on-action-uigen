import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
});

describe("useAuth", () => {
  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    describe("happy path — no anonymous work, existing projects", () => {
      it("calls signInAction with email and password", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
      });

      it("redirects to the most recent project on success", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([
          { id: "proj-1", name: "Recent", createdAt: new Date(), updatedAt: new Date() },
          { id: "proj-2", name: "Older", createdAt: new Date(), updatedAt: new Date() },
        ]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });

      it("returns the result from signInAction", async () => {
        const authResult = { success: true };
        mockSignIn.mockResolvedValue(authResult);
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        let returnValue: unknown;
        await act(async () => {
          returnValue = await result.current.signIn("user@example.com", "password123");
        });

        expect(returnValue).toEqual(authResult);
      });
    });

    describe("happy path — no anonymous work, no existing projects", () => {
      it("creates a new project and redirects when no projects exist", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-proj", name: "New Design", createdAt: new Date(), updatedAt: new Date(), userId: "u1", messages: "[]", data: "{}" });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/new-proj");
      });
    });

    describe("happy path — with anonymous work", () => {
      it("creates a project from anonymous work and redirects", async () => {
        const anonMessages = [{ role: "user", content: "hello" }];
        const anonFileSystemData = { "/": { type: "directory" }, "/App.tsx": { content: "code" } };
        mockSignIn.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({ messages: anonMessages, fileSystemData: anonFileSystemData });
        mockCreateProject.mockResolvedValue({ id: "anon-proj", name: "Design", createdAt: new Date(), updatedAt: new Date(), userId: "u1", messages: "[]", data: "{}" });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonMessages,
            data: anonFileSystemData,
          })
        );
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/anon-proj");
      });

      it("does not call getProjects when anonymous work exists", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({ messages: [{ role: "user", content: "hi" }], fileSystemData: {} });
        mockCreateProject.mockResolvedValue({ id: "anon-proj", name: "D", createdAt: new Date(), updatedAt: new Date(), userId: "u1", messages: "[]", data: "{}" });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockGetProjects).not.toHaveBeenCalled();
      });
    });

    describe("edge cases", () => {
      it("does not redirect when signIn fails", async () => {
        mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "wrongpassword");
        });

        expect(mockPush).not.toHaveBeenCalled();
        expect(mockGetProjects).not.toHaveBeenCalled();
        expect(mockCreateProject).not.toHaveBeenCalled();
      });

      it("skips anon-work migration when anonWork has empty messages", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).not.toHaveBeenCalledWith(
          expect.objectContaining({ messages: [] })
        );
        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });

      it("returns result and resets isLoading even when signIn action throws", async () => {
        mockSignIn.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await expect(result.current.signIn("user@example.com", "password123")).rejects.toThrow("Network error");
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    describe("loading state", () => {
      it("sets isLoading to true during signIn and false after", async () => {
        let resolveSignIn!: (v: { success: boolean }) => void;
        mockSignIn.mockReturnValue(new Promise((res) => { resolveSignIn = res; }));
        mockGetProjects.mockResolvedValue([{ id: "p", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());

        let signInPromise!: Promise<unknown>;
        act(() => {
          signInPromise = result.current.signIn("user@example.com", "password123");
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolveSignIn({ success: true });
          await signInPromise;
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signUp", () => {
    describe("happy path — no anonymous work, existing projects", () => {
      it("calls signUpAction with email and password", async () => {
        mockSignUp.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password123");
      });

      it("redirects to the most recent project after successful sign-up", async () => {
        mockSignUp.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });

      it("returns the result from signUpAction", async () => {
        const authResult = { success: true };
        mockSignUp.mockResolvedValue(authResult);
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        let returnValue: unknown;
        await act(async () => {
          returnValue = await result.current.signUp("new@example.com", "password123");
        });

        expect(returnValue).toEqual(authResult);
      });
    });

    describe("happy path — with anonymous work", () => {
      it("migrates anonymous work on sign-up", async () => {
        const anonMessages = [{ role: "user", content: "hello" }];
        mockSignUp.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({ messages: anonMessages, fileSystemData: { "/": {} } });
        mockCreateProject.mockResolvedValue({ id: "new-anon", name: "D", createdAt: new Date(), updatedAt: new Date(), userId: "u1", messages: "[]", data: "{}" });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: anonMessages })
        );
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/new-anon");
      });
    });

    describe("edge cases", () => {
      it("does not redirect when signUp fails", async () => {
        mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("existing@example.com", "password123");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });

      it("resets isLoading even when signUp action throws", async () => {
        mockSignUp.mockRejectedValue(new Error("Server error"));

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await expect(result.current.signUp("new@example.com", "password123")).rejects.toThrow("Server error");
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    describe("loading state", () => {
      it("sets isLoading to true during signUp and false after", async () => {
        let resolveSignUp!: (v: { success: boolean }) => void;
        mockSignUp.mockReturnValue(new Promise((res) => { resolveSignUp = res; }));
        mockGetProjects.mockResolvedValue([{ id: "p", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());

        let signUpPromise!: Promise<unknown>;
        act(() => {
          signUpPromise = result.current.signUp("new@example.com", "password123");
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolveSignUp({ success: true });
          await signUpPromise;
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
