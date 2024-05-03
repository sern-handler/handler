import type { IntoDependencies } from '../../types/ioc';
import { Service as __Service, Services as __Services } from './global'
/**
 * @since 2.0.0.
 * Creates a singleton object.
 * @param cb
 */
export function single<T>(cb: () => T) { return cb; }

/**
 * @__PURE__
 * @since 2.0.0
 * Creates a transient object
 * @param cb
 */
export function transient<T>(cb: () => () => T) { return cb; }

