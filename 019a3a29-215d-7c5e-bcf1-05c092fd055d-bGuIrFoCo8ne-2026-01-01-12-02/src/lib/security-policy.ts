export function publicRegistrationRole(role: unknown): 'CUSTOMER' | 'DRIVER' | null {
  if (typeof role !== 'string') return null;
  const normalized = role.toUpperCase();
  return normalized === 'CUSTOMER' || normalized === 'DRIVER' ? normalized : null;
}

export function requireJwtSecret(env: Record<string, string | undefined>): string {
  const secret = env.NEXTAUTH_SECRET;
  if (!secret || secret.trim().length < 32 || secret === 'your-secret-key-change-in-production') {
    throw new Error('NEXTAUTH_SECRET must be configured with at least 32 random characters');
  }
  return secret;
}
