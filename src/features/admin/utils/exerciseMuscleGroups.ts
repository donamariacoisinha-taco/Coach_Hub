import { Exercise, MuscleGroup } from '../../../types';

export interface MuscleGroupCluster {
  parent: MuscleGroup;
  clusters: MuscleGroup[];
}

/**
 * Groups the muscle taxonomy for the editor. A group with children is a
 * category only; its children are the selectable exercise clusters.
 */
export function getMuscleGroupClusters(muscleGroups: MuscleGroup[]): MuscleGroupCluster[] {
  const byId = new Map(muscleGroups.map((group) => [group.id, group]));
  const childrenByParent = new Map<string, MuscleGroup[]>();

  muscleGroups.forEach((group) => {
    if (!group.parent_id || !byId.has(group.parent_id)) return;
    const children = childrenByParent.get(group.parent_id) || [];
    children.push(group);
    childrenByParent.set(group.parent_id, children);
  });

  const roots = muscleGroups.filter((group) => !group.parent_id || !byId.has(group.parent_id));

  return roots
    .map((parent) => ({
      parent,
      clusters: (childrenByParent.get(parent.id) || []).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    }))
    .sort((a, b) => (a.parent.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.parent.sort_order ?? Number.MAX_SAFE_INTEGER) || a.parent.name.localeCompare(b.parent.name, 'pt-BR'));
}

/**
 * Keeps the denormalized legacy labels in step with the canonical cluster id.
 */
export function getMuscleGroupSelectionUpdate(
  clusterId: string,
  muscleGroups: MuscleGroup[],
): Pick<Exercise, 'muscle_group_id' | 'muscle_group' | 'subgroup'> {
  const cluster = muscleGroups.find((group) => group.id === clusterId);

  if (!cluster) {
    return { muscle_group_id: '', muscle_group: '', subgroup: null };
  }

  const parent = cluster.parent_id
    ? muscleGroups.find((group) => group.id === cluster.parent_id)
    : undefined;

  return {
    muscle_group_id: cluster.id,
    muscle_group: (parent || cluster).name,
    subgroup: parent ? cluster.name : null,
  };
}
