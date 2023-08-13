import { Result as Either } from 'ts-results-es';
import { SernError } from '../_internal';
import * as assert from 'node:assert';

/**
 * @since 3.0.0
 */
export abstract class CoreContext<M, I> {
    protected constructor(protected ctx: Either<M, I>) {
        assert.ok(typeof ctx === 'object' && ctx != null);
    }
    get message(): M {
        return this.ctx.expect(SernError.MismatchEvent);
    }
    get interaction(): I {
        return this.ctx.expectErr(SernError.MismatchEvent);
    }

    public isMessage(): this is CoreContext<M, never> {
        return this.ctx.isOk();
    }

    public isSlash(): this is CoreContext<never, I> {
        return !this.isMessage();
    }
    //todo: add agnostic options resolver for Context
    abstract get options(): unknown;

    static wrap(_: unknown): unknown {
        throw Error('You need to override this method; cannot wrap an abstract class');
    }
}
