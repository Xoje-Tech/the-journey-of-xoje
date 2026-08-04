export function getLocaleFromRoute(rawLocale: string | undefined): 'en' | null {
  if (rawLocale === 'en') {
    return 'en';
  }

  return null;
}

export function getRouteRedirectPath(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments.length === 1 && segments[0] === 'en') {
    return null;
  }

  if (segments.length === 1 && segments[0] === 'es') {
    return '/';
  }

  return '/';
}
