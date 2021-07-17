
import { Db } from 'less-api-database'
import { Request } from './request/request'
import { UniRequest } from './request/request-uni'
import { WxmpRequest } from './request/request-wxmp'
import { CloudOptions, EnvironmentType, RequestInterface, UploadFile } from './types'


/**
 * Cloud 提供 less-api 和 less-framework 的客户端操作接口： 数据库查询 ORM、云函数调用、文件上传
 */
class Cloud {
  private config: CloudOptions

  /**
   * less-framework 文件上传、下载基地址
   */
  get fileBaseUrl(): string {
    return this.config.baseUrl + '/file'
  }

  /**
   * less-framework 云函数调用基地址
   */
  get funcBaseUrl(): string {
    return this.config.baseUrl + '/func'
  }

  /**
   * 根据配置获取请求类
   */
  private get requestClass() {
    const env = this.config?.environment
    let ret = Request
    if (this.config?.requestClass) {
      ret = this.config?.requestClass
    } else if (env === EnvironmentType.UNI_APP) {
      ret = UniRequest
    } else if (env === EnvironmentType.WX_MP) {
      ret = WxmpRequest
    } else {
      ret = Request
    }

    return ret
  }

  /**
   * 请求对象
   */
  protected _request: RequestInterface


  constructor(config: CloudOptions) {
    const warningFunc = () => {
      console.warn('WARNING: no getAccessToken set for less-api request')
      return ""
    }

    this.config = {
      baseUrl: config.baseUrl,
      entryUrl: this.resolveEntryUrl(config),
      getAccessToken: config?.getAccessToken || warningFunc,
      environment: config?.environment || EnvironmentType.H5,
      primaryKey: config?.primaryKey,
      timeout: config?.timeout,
      headers: config?.headers,
      requestClass: config?.requestClass
    }

    const reqClass = this.requestClass
    this._request = new reqClass(this.config)
  }

  /**
   * 获取数据库操作对象
   * @returns 
   */
  database() {
    Db.reqClass = this.requestClass
    Db.getAccessToken = this.config.getAccessToken
    return new Db({ ...this.config })
  }

  /**
   * 调用云函数
   */
  async invokeFunctin(functionName: string, data: any) {
    const res = await this
      ._request
      .request(this.funcBaseUrl + `/invoke/${functionName}`, data)

    return res.data
  }

  /**
   * 上传文件
   */
   async uploadFile(file: UploadFile, namepsace = 'public') {
     const res = await this
      ._request
      .upload({
        url: this.fileBaseUrl + `/upload/${namepsace}`,
        files: [file]
      })

    return res.data
  }

  /**
   * 为了兼容 less-api 老版本用法，处理 entry url 为绝对路径
   * @param options 
   * @returns 
   */
   private resolveEntryUrl(options: CloudOptions) {
    if(!options.entryUrl) {
      throw new Error('entryUrl should NOT be empty')
    }

    if(options.entryUrl?.startsWith('/') && options.baseUrl) {
      return options.baseUrl + options.entryUrl
    } 

    return options.entryUrl
  }
}

export {
  Cloud,
  Db,
  Request
}
