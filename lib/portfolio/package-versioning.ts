/**
 * Reporting package version chains (supersede, replace, supplement).
 */

import type {
  PackageRelationship,
  ReportingPackageVersion,
} from "./monitoring-phase-types";
import type { ReportingPackage } from "./types";

export type VersionedPackage = ReportingPackage & {
  fileHash?: string;
  versionNumber?: number;
  relationship?: PackageRelationship;
  previousPackageId?: string;
  activeVersion?: boolean;
  versionGroupId?: string;
};

export function getPackageVersions(
  packages: VersionedPackage[],
  packageId: string
): ReportingPackageVersion[] {
  const target = packages.find((p) => p.id === packageId);
  if (!target) return [];
  const groupId = target.versionGroupId ?? target.id;
  const group = packages.filter(
    (p) => p.versionGroupId === groupId || p.id === groupId || p.previousPackageId === packageId
  );
  // Walk chain
  const related = packages.filter(
    (p) =>
      p.id === groupId ||
      p.versionGroupId === groupId ||
      p.previousPackageId === target.id ||
      target.previousPackageId === p.id ||
      group.some((g) => g.id === p.id || g.previousPackageId === p.id)
  );
  const uniq = new Map(related.map((p) => [p.id, p]));
  return [...uniq.values()]
    .sort((a, b) => (a.versionNumber ?? 1) - (b.versionNumber ?? 1))
    .map((p) => ({
      packageId: p.id,
      versionNumber: p.versionNumber ?? 1,
      relationship: p.relationship ?? "original",
      previousPackageId: p.previousPackageId,
      activeVersion: p.activeVersion ?? p.id === packageId,
      createdAt: p.uploadedAt,
      createdBy: "system",
    }));
}

export function nextVersionNumber(
  packages: VersionedPackage[],
  previousPackageId: string
): number {
  const versions = getPackageVersions(packages, previousPackageId);
  const max = versions.reduce((m, v) => Math.max(m, v.versionNumber), 0);
  return max + 1;
}

export function buildRevisionPackageFields(input: {
  previous: VersionedPackage;
  relationship: PackageRelationship;
  createdBy: string;
}): Partial<VersionedPackage> {
  const groupId = input.previous.versionGroupId ?? input.previous.id;
  return {
    versionGroupId: groupId,
    previousPackageId: input.previous.id,
    versionNumber: (input.previous.versionNumber ?? 1) + 1,
    relationship: input.relationship,
    activeVersion: true,
  };
}

export function markSuperseded(
  packages: VersionedPackage[],
  previousPackageId: string
): VersionedPackage[] {
  return packages.map((p) =>
    p.id === previousPackageId
      ? { ...p, activeVersion: false, relationship: "superseded" as const }
      : p
  );
}
