import { EngineerProject } from "./engineer-types";

export const isAcceptedEngineerProject = (project: EngineerProject) =>
  Boolean(project.engineerId) ||
  Boolean(
    project.projectMembers?.some(
      (member) =>
        member.role?.toLowerCase() === "engineer" &&
        member.status?.toLowerCase() === "accepted",
    ),
  );

export const money = (value?: string | number | null, currency = "RWF") =>
  `${Number(value || 0).toLocaleString()} ${currency}`;
