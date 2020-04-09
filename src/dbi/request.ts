import { ActionType } from "../types"
import { DbConfig } from "."
import { Entry } from "../entry"

export class Request {

  private config: DbConfig

  constructor(config: DbConfig) {
    this.config = config
  }

  async send(action: ActionType, data: object) {

    const { accessor } = this.config

    const params = Entry.parse(action, data)

    const ret = await accessor.execute(params)

    return {
      code: 0,
      data: ret
    }
  }
}