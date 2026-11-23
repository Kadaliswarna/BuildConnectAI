/** Turns Firebase errors into messages a person can act on. */
export function authMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Wrong email or password.'
    case 'auth/email-already-in-use': return 'An account with this email already exists.'
    case 'auth/weak-password': return 'Password must be at least 6 characters.'
    case 'auth/invalid-email': return 'That email address looks invalid.'
    case 'auth/too-many-requests': return 'Too many attempts. Try again in a few minutes.'
    case 'auth/network-request-failed': return 'Network error. Check your connection.'
    case 'permission-denied': return 'You do not have permission to do that.'
  }
  return err instanceof Error ? err.message : 'Something went wrong.'
}
