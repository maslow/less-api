
export interface ErrorRes {
  code: string | number,
  error?: string
}

export interface BaseResult extends ErrorRes {
  requestId?: string
  total?: number
  limit?: number
  offset?: number,
  ok?: boolean
}

export interface GetRes<T> extends BaseResult {
  data: T[]
  total?: number
  limit?: number
  offset?: number
}

export interface GetOneRes<T> extends BaseResult{
  data: T
}

export interface UpdateRes extends BaseResult {
  updated?: number
  matched?: number
  upsertedId?: number
}

export interface AddRes extends BaseResult{
  id: string | number
  insertedCount: number
}

export interface RemoveRes extends BaseResult{
  deleted: number
}

export interface CountRes extends BaseResult{
  total: number
}
