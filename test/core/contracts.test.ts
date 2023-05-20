import { assertType, describe, it, vi } from "vitest";
import * as DefaultContracts from '../../src/core/structures/services'
import * as Contracts from '../../src/core/contracts/index.js'
import { ModuleStore } from "../../src/core";

describe('default contracts', () => {
    it('should satisfy contracts', () => {
        assertType<Contracts.Logging>(new DefaultContracts.DefaultLogging())
        assertType<Contracts.ErrorHandling>(new DefaultContracts.DefaultErrorHandling())
        assertType<Contracts.ModuleManager>(new DefaultContracts.DefaultModuleManager(new ModuleStore()))
        assertType<Contracts.CoreModuleStore>(new ModuleStore())
    })

})
