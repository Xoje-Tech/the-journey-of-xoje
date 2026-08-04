import { describe, expect, it } from 'vitest';
import { getRouteRedirectPath, getLocaleFromRoute } from '../src/shared/lib/route-utils';

describe('route redirect helpers', () => {
  it('accepts the supported locale routes', () => {
    expect(getLocaleFromRoute('en')).toBe('en');
    expect(getLocaleFromRoute('es')).toBeNull();
  });

  it('redirects invalid routes to the base route', () => {
    expect(getRouteRedirectPath('/')).toBeNull();
    expect(getRouteRedirectPath('/en')).toBeNull();
    expect(getRouteRedirectPath('/es')).toBe('/');
    expect(getRouteRedirectPath('/foo')).toBe('/');
    expect(getRouteRedirectPath('/foo/bar')).toBe('/');
  });
});
