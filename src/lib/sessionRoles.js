export function assignRoles(mode, members, currentTurn) {
  const shuffled = [...members].sort(() => Math.random() - 0.5);
  const roles = {
    A: null,
    B: null,
    C: [],
    D: null,
  };

  if (mode === 'remote') {
    roles.A = shuffled[0] || null;
    roles.B = null;

    const remaining = shuffled.slice(1);

    if (remaining.length === 2) {
      roles.C = [remaining[0]];
      roles.D = roles.A;
    } else if (remaining.length === 3) {
      roles.C = [remaining[0], remaining[1]];
      roles.D = remaining[2];
    } else {
      roles.C = remaining.slice(0, -1);
      roles.D = remaining[remaining.length - 1];
    }
  } else {
    roles.A = null;
    roles.B = null;

    if (shuffled.length === 2) {
      roles.C = [shuffled[0]];
      roles.D = shuffled[1];
    } else if (shuffled.length === 3) {
      roles.C = [shuffled[0]];
      roles.D = shuffled[1];
    } else {
      roles.C = shuffled.slice(0, -1);
      roles.D = shuffled[shuffled.length - 1];
    }
  }

  return roles;
}

export function getRoleName(roles, userId) {
  if (roles.A?.id === userId) return 'Elector';
  if (roles.B?.id === userId) return 'Descubridor';
  if (roles.C.some(m => m.id === userId)) return 'Traductor';
  if (roles.D?.id === userId) return 'Constructor';
  return 'Participante';
}
