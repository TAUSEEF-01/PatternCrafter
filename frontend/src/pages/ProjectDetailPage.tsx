import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { Project, Task } from "@/types";
import { useAuth } from "@/auth/AuthContext";

// Temporary workaround for react-router-dom Link typing mismatch across the file
const LinkFix = RouterLink as unknown as any;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // QA Management
  const [projectAnnotators, setProjectAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [qaAnnotators, setQaAnnotators] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  useEffect(() => {
    if (!projectId) return;
    apiFetch<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch((e) => setError(String(e)));
    const tasksPath =
      user?.role === "annotator"
        ? `/projects/${projectId}/my-tasks`
        : `/projects/${projectId}/tasks`;
    apiFetch<Task[]>(tasksPath)
      .then(setTasks)
      .catch((e) => setError(String(e)));

    // Load annotators and QA annotators for managers
    if (user?.role !== "annotator") {
      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/annotators`
      )
        .then(setProjectAnnotators)
        .catch((e) => console.error("Failed to load annotators:", e));

      apiFetch<{ id: string; name: string; email: string }[]>(
        `/projects/${projectId}/qa-annotators`
      )
        .then(setQaAnnotators)
        .catch((e) => console.error("Failed to load QA annotators:", e));
    }
  }, [projectId, user?.role]);

  // Task statistics
  const taskStats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => !t.completed_status?.annotator_part).length,
    completed: tasks.filter((t) => t.completed_status?.annotator_part).length,
    returned: tasks.filter((t) => t.is_returned).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{project?.details || "Project Details"}</h1>
          {project && (
            <div className="muted mt-1">
              <span className="badge badge-primary">{project.category}</span>
            </div>
          )}
        </div>
        <LinkFix className="btn btn-ghost" to="/projects">
          ← Back to Projects
        </LinkFix>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-blue-600">
              {taskStats.total}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {taskStats.inProgress}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-green-600">
              {taskStats.completed}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </div>
        {taskStats.returned > 0 && (
          <div className="card">
            <div className="card-body text-center">
              <div className="text-3xl font-bold text-amber-600">
                {taskStats.returned}
              </div>
              <div className="text-sm text-gray-600 mt-1">Returned</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Cards */}
      {user?.role === "annotator" ? (
        // Annotator View
        <div className="grid md:grid-cols-2 gap-4">
          {taskStats.returned > 0 && (
            <LinkFix
              to={`/projects/${projectId}/tasks/returned`}
              className="card hover:shadow-xl transition-shadow border-l-4 border-amber-500"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700">
                      ⚠️ Tasks Needing Revision
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {taskStats.returned} task(s) returned for rework
                    </p>
                  </div>
                  <div className="text-3xl">→</div>
                </div>
              </div>
            </LinkFix>
          )}

          <LinkFix
            to={`/projects/${projectId}/tasks/in-progress`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-blue-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Your Assigned Tasks</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {
                      tasks.filter(
                        (t) =>
                          !t.is_returned && !t.completed_status?.annotator_part
                      ).length
                    }{" "}
                    task(s) ready to work on
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/tasks/completed`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-green-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Your Completed Tasks
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {
                      tasks.filter(
                        (t) =>
                          t.completed_status?.annotator_part && !t.is_returned
                      ).length
                    }{" "}
                    task(s) submitted for review
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>
        </div>
      ) : (
        // Manager View
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LinkFix
            to={`/projects/${projectId}/tasks/create`}
            state={{ category: project?.category }}
            className="card hover:shadow-xl transition-shadow border-l-4 border-purple-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">➕ Create Task</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a new task to this project
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/tasks/in-progress`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-yellow-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    ⏳ Tasks In Progress
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {taskStats.inProgress} task(s) being worked on
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/tasks/annotator-completed`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-green-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    ✅ Completed by Annotator
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {taskStats.completed} task(s) awaiting review
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/completed`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-blue-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">🎯 Fully Completed</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View all finished tasks
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>

          <LinkFix
            to={`/projects/${projectId}/roles`}
            className="card hover:shadow-xl transition-shadow border-l-4 border-indigo-500"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">👥 Manage Roles</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Assign annotators and QA reviewers
                  </p>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </LinkFix>
        </div>
      )}

      {/* Team Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Annotators */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-3">
              👤 Annotators ({projectAnnotators.length})
            </h3>
            {projectAnnotators.length === 0 ? (
              <p className="text-sm text-gray-500">No annotators yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-auto">
                {projectAnnotators.map((annotator) => (
                  <div
                    key={annotator.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {annotator.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {annotator.email}
                      </div>
                    </div>
                    {qaAnnotators.some((qa) => qa.id === annotator.id) && (
                      <div className="badge badge-primary badge-sm">QA</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QA Reviewers */}
        {user?.role !== "annotator" && (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  🔍 QA Reviewers ({qaAnnotators.length})
                </h3>
                <LinkFix
                  to={`/projects/${projectId}/roles`}
                  className="btn btn-outline btn-sm"
                >
                  Manage
                </LinkFix>
              </div>
              {qaAnnotators.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No QA reviewers assigned yet
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {qaAnnotators.map((qa) => (
                    <div
                      key={qa.id}
                      className="flex items-center gap-2 p-2 bg-green-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{qa.name}</div>
                        <div className="text-xs text-gray-500">{qa.email}</div>
                      </div>
                      <div className="badge badge-green badge-sm">QA</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
