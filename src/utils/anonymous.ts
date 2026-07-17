import { cookies } from 'next/headers';

export async function getAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  const id = cookieStore.get('rewise_anonymous_id')?.value;
  if (!id) {
    // If not found in cookieStore (e.g. during a build/SSR pre-render or middleware mismatch),
    // we should return an empty string. Under normal runtime operation it is set by middleware.
    return '';
  }
  return id;
}
