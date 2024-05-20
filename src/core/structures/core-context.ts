import { Result as Either } from 'ts-results-es';
import { SernError } from './enums';
import * as assert from 'node:assert';

/**
 * @since 3.0.0
 */
export abstract class CoreContext<M, I> {
    protected constructor(protected ctx: Either<M, I>) {
        assert.ok(typeof ctx === 'object' && ctx != null, "Context was nonobject or null");
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
}
