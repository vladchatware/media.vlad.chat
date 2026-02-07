import { StudioLaunchButton } from "@/components/workspace/studio-launch-button";
import { loadWorkspaceData } from "@/src/workspace/load";

const statusClassName = (status: "draft" | "rendering" | "ready") => {
  return `status status-${status}`;
};

export default async function WorkspacePage() {
  const workspaceData = await loadWorkspaceData();
  const totals = {
    projects: workspaceData.projects.length,
    rendering: workspaceData.projects.filter((p) => p.status === "rendering")
      .length,
    ready: workspaceData.projects.filter((p) => p.status === "ready").length,
  };

  const recentEvents = workspaceData.projects.slice(0, 3).map((project) => {
    const prefix =
      project.status === "ready"
        ? "Assets ready"
        : project.status === "rendering"
          ? "Render in progress"
          : "Draft updated";

    return `${prefix}: ${project.title}`;
  });

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <h1 className="workspace-title">{workspaceData.name}</h1>
          <p className="workspace-subtitle">
            Workspace UI for generation queue, asset scope, and Studio launch.
          </p>
        </div>
        <div className="role-pill">Role: {workspaceData.memberRole}</div>
      </header>

      <section className="grid" aria-label="workspace-stats">
        <article className="panel kpi">
          <p className="kpi-label">Projects</p>
          <p className="kpi-value">{totals.projects}</p>
        </article>
        <article className="panel kpi">
          <p className="kpi-label">Rendering</p>
          <p className="kpi-value">{totals.rendering}</p>
        </article>
        <article className="panel kpi">
          <p className="kpi-label">Ready</p>
          <p className="kpi-value">{totals.ready}</p>
        </article>

        <article className="panel projects-panel">
          <h2 className="panel-title">Projects</h2>
          {workspaceData.projects.map((project) => (
            <div key={project.id} className="project-row">
              <div>
                <strong>{project.title}</strong>
                <div className="project-meta">
                  <span>{project.compositionId}</span>
                  <span>•</span>
                  <span>{project.updatedAt}</span>
                  <span className={statusClassName(project.status)}>
                    {project.status}
                  </span>
                </div>
              </div>
              <StudioLaunchButton
                workspaceId={workspaceData.id}
                projectId={project.id}
                compositionId={project.compositionId}
                inputProps={project.inputProps}
                assets={project.assets}
              />
            </div>
          ))}
        </article>

        <aside className="panel events-panel">
          <h2 className="panel-title">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <div className="event-item">
              No projects found in `stories/` yet.
            </div>
          ) : (
            recentEvents.map((event) => (
              <div className="event-item" key={event}>
                {event}
              </div>
            ))
          )}
        </aside>
      </section>
    </main>
  );
}
