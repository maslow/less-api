import { Policy } from './policy'
import { Ruler as RulerV1 } from './ruler_v1'
import { Policy as RulerV2 } from './policy'

export * from './interface'

/**
 * Ruler 为别名，为了兼容老版本应用
 */
export { RulerV1, RulerV2, Policy as Ruler, Policy }
