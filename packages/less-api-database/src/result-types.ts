
export interface GetRes<T> {
  data: T[]
  requestId: string
  total?: number
  limit?: number
  offset?: number,
  ok: boolean
}

export interface GetOneRes {
  data: any
  requestId: string
  ok: boolean
}

export interface UpdateRes {
  updated: number,
  matched: number,
  upsertedId: number,
  requestId: string,
  ok: boolean
}

export interface RemoveRes {
  deleted: number,
  requestId: string,
  ok: boolean
}

export interface CountRes {
  total: number,
  requestId: string,
  ok: boolean
}

export interface ErrorRes {
  code: string | number,
  error: string
}