import { filter, hasRole } from "../../plugins/filter.js";
import { ownerOnly } from "../../plugins/ownerOnly.js";
import { ADMIN } from '../../constants.js'

export default [
    ownerOnly(),
    filter({ condition: [hasRole(ADMIN)] })
]
