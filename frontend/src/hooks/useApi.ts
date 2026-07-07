import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";
import { useAuthStore } from "@/store/useAuthStore";

// 1. Fetch Courses
export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: () => apiFetch("/courses"),
  });
}

// 2. Fetch Semesters
export function useSemesters(courseId: number) {
  return useQuery({
    queryKey: ["semesters", courseId],
    queryFn: () => apiFetch(`/courses/${courseId}/semesters`),
    enabled: !!courseId,
  });
}

// 3. Fetch Subject Details (Syllabus)
export function useSubject(subjectId: number) {
  return useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => apiFetch(`/courses/subjects/${subjectId}`),
    enabled: !!subjectId,
  });
}

// 4. Fetch Single Lesson Details
export function useLesson(lessonId: number) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => apiFetch(`/courses/lessons/${lessonId}`),
    enabled: !!lessonId,
  });
}

// 5. Fetch Lesson Progress log
export function useLessonProgress(lessonId: number) {
  return useQuery({
    queryKey: ["progress", lessonId],
    queryFn: () => apiFetch(`/progress/lessons/${lessonId}`),
    enabled: !!lessonId,
  });
}

// 6. Update Lesson Progress mutation
export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, watch_percentage, time_spent_seconds, resume_position, status }: {
      lessonId: number;
      watch_percentage: number;
      time_spent_seconds: number;
      resume_position: number;
      status: string;
    }) => apiFetch(`/progress/lessons/${lessonId}`, {
      method: "POST",
      body: JSON.stringify({ watch_percentage, time_spent_seconds, resume_position, status }),
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress", variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["spaced-revisions"] });
    }
  });
}

// 7. Submit Retrieval & Reflection
export function useSubmitReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, retrieval_text, unresolved_question, confidence_rating }: {
      lessonId: number;
      retrieval_text: string;
      unresolved_question?: string;
      confidence_rating: number;
    }) => apiFetch(`/progress/lessons/${lessonId}/reflection`, {
      method: "POST",
      body: JSON.stringify({ retrieval_text, unresolved_question, confidence_rating }),
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress", variables.lessonId] });
    }
  });
}

// 8. Fetch Spaced Revisions due
export function useSpacedRevisions() {
  return useQuery({
    queryKey: ["spaced-revisions"],
    queryFn: () => apiFetch("/progress/spaced-revisions"),
  });
}

// 9. Complete Spaced Revision mutation
export function useCompleteRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: number) => apiFetch(`/progress/spaced-revisions/${revisionId}/complete`, {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaced-revisions"] });
    }
  });
}

// 10. Fetch Quiz Details
export function useQuiz(quizId: number) {
  return useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => apiFetch(`/quizzes/${quizId}`),
    enabled: !!quizId,
  });
}

// 11. Submit Quiz answers mutation
export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, answers }: {
      quizId: number;
      answers: Array<{ question_id: number; selected_option_index: number; confidence_rating: string }>;
    }) => apiFetch(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mistakes"] });
      queryClient.invalidateQueries({ queryKey: ["mistake-stats"] });
    }
  });
}

// 12. Fetch Mock tests list
export function useMocks() {
  return useQuery({
    queryKey: ["mocks"],
    queryFn: () => apiFetch("/mocks"),
  });
}

// 13. Fetch Mock Test detailed sheet
export function useMockDetails(mockId: number) {
  return useQuery({
    queryKey: ["mock", mockId],
    queryFn: () => apiFetch(`/mocks/${mockId}`),
    enabled: !!mockId,
  });
}

// 14. Submit Mock answers mutation
export function useSubmitMock() {
  return useMutation({
    mutationFn: ({ mockId, answers, review_palette }: {
      mockId: number;
      answers: Array<{ question_id: number; selected_option_index: number; confidence_rating: string }>;
      review_palette: any;
    }) => apiFetch(`/mocks/${mockId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, review_palette }),
    }),
  });
}

// 15. Fetch Mistake Journal items
export function useMistakes(resolved: boolean = false) {
  return useQuery({
    queryKey: ["mistakes", resolved],
    queryFn: () => apiFetch(`/journal?resolved=${resolved}`),
  });
}

// 16. Fetch Mistake Stats
export function useMistakeStats() {
  return useQuery({
    queryKey: ["mistake-stats"],
    queryFn: () => apiFetch("/journal/stats"),
  });
}

// 17. Resolve Mistake journal item mutation
export function useResolveMistake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mistakeId, selected_option_index }: { mistakeId: number; selected_option_index: number }) =>
      apiFetch(`/journal/${mistakeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ selected_option_index }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mistakes"] });
      queryClient.invalidateQueries({ queryKey: ["mistake-stats"] });
    }
  });
}

// 18. Fetch In-App Notifications list
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications"),
  });
}

// 19. Mark Notification Read mutation
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => apiFetch(`/notifications/${notificationId}/read`, {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

// 20. Fetch AI Study Coach Tips
export function useCoachTip() {
  return useQuery({
    queryKey: ["coach-tip"],
    queryFn: () => apiFetch("/ai/coach-tip"),
  });
}

// 21. User Onboarding Profile Mutation
export function useOnboardUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: {
      who_are_you: string;
      why_learning: string;
      exam_date: string;
      daily_time: string;
      weak_subjects: string[];
      strong_subjects: string[];
      knowledge_level: string;
    }) => apiFetch("/auth/onboard", {
      method: "POST",
      body: JSON.stringify(profile),
    }),
    onSuccess: (data) => {
      // Server sets HttpOnly cookies; just sync user profile to Zustand
      useAuthStore.getState().setAuth(data);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
}

// 22. Unified login or signup mutation
export function useLoginOrSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) => apiFetch("/auth/login-or-signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
    onSuccess: () => {
      // HttpOnly cookies are set by server; no token storage needed client-side
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
}

// 23. Google auth login mutation
export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idToken: string) => apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }),
    onSuccess: () => {
      // HttpOnly cookies are set by server; no token storage needed client-side
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
}

// 24. Profile update mutation
export function useProfileUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: {
      name?: string;
      course?: string;
      daily_time?: string;
      onboarded?: boolean;
      exam_date?: string;
      weak_subjects?: string[];
      strong_subjects?: string[];
      knowledge_level?: string;
      gender?: string;
      mobile_number?: string;
      password?: string;
    }) => apiFetch("/auth/profile-update", {
      method: "POST",
      body: JSON.stringify(profile),
    }),
    onSuccess: (data) => {
      // Sync updated profile to Zustand state
      useAuthStore.getState().setAuth(data);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
}

// ── Phase 2 Hooks ─────────────────────────────────────────────────────────────

export function useMyAnalytics() {
  return useQuery({
    queryKey: ["my-analytics"],
    queryFn: () => apiFetch("/analytics/me"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useStudyPlan() {
  return useQuery({
    queryKey: ["study-plan"],
    queryFn: () => apiFetch("/ai/study-plan"),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useNewConversation() {
  return useMutation({
    mutationFn: () => apiFetch("/ai/doubt/new-session", { method: "POST" }),
  });
}

// ── Admin Hub Hooks ─────────────────────────────────────────────────────────

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiFetch("/admin/analytics"),
  });
}

export function useAdminStudents() {
  return useQuery({
    queryKey: ["admin-students"],
    queryFn: () => apiFetch("/admin/students"),
  });
}

export function useAdminStudentProgress(userId: number) {
  return useQuery({
    queryKey: ["admin-student-progress", userId],
    queryFn: () => apiFetch(`/admin/users/${userId}/progress`),
    enabled: !!userId,
  });
}

export function useAdminUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiFetch(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
  });
}

export function useAdminResetUserPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      apiFetch(`/admin/users/${userId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
      }),
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/admin/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });
}

// Course/CMS mutations
export function useAdminCreateSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sem: { course_id: number; title: string; description?: string; order?: number }) =>
      apiFetch("/admin/semesters", {
        method: "POST",
        body: JSON.stringify(sem),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useAdminUpdateSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; description?: string; order?: number }) =>
      apiFetch(`/admin/semesters/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useAdminDeleteSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/semesters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useAdminCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sub: { semester_id: number; title: string; description?: string; code: string; order?: number }) =>
      apiFetch("/admin/subjects", {
        method: "POST",
        body: JSON.stringify(sub),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useAdminUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; description?: string; code?: string; order?: number }) =>
      apiFetch(`/admin/subjects/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useAdminDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/subjects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
}

export function useAdminCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ch: { subject_id: number; title: string; description?: string; order?: number }) =>
      apiFetch("/admin/chapters", {
        method: "POST",
        body: JSON.stringify(ch),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
    },
  });
}

export function useAdminUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; title?: string; description?: string; order?: number }) =>
      apiFetch(`/admin/chapters/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
    },
  });
}

export function useAdminDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/chapters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
    },
  });
}

export function useAdminCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lesson: {
      chapter_id: number;
      title: string;
      description?: string;
      video_provider?: string;
      video_id?: string;
      duration_seconds?: number;
      order?: number;
      prerequisites?: string;
      outcomes?: string;
    }) =>
      apiFetch("/admin/lessons", {
        method: "POST",
        body: JSON.stringify(lesson),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
    },
  });
}

export function useAdminUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: {
      id: number;
      title?: string;
      description?: string;
      video_provider?: string;
      video_id?: string;
      duration_seconds?: number;
      order?: number;
      prerequisites?: string;
      outcomes?: string;
    }) =>
      apiFetch(`/admin/lessons/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
      queryClient.invalidateQueries({ queryKey: ["lesson"] });
    },
  });
}

export function useAdminDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/lessons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
    },
  });
}

