type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type RequestConfig = {
  method?: RequestMethod
  timeout?: number
  headers?: Record<string, string>
  data?: any
  params?: Record<string, string>
}

type Interceptor<T> = {
  onFulfilled: (value: T) => T | Promise<T>
  onRejected?: (error: any) => any
}

// 核心配置
const config = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
}

// 拦截器存储
const interceptors = {
  request: [] as Interceptor<RequestConfig>[],
  response: [] as Interceptor<Response>[],
}

// 请求核心方法
const request = async <T = any>(url: string, options: RequestConfig = {}): Promise<T> => {
  try {
    // 合并配置
    const mergedConfig: RequestConfig = {
      ...config,
      ...options,
      headers: { ...config.headers, ...options.headers }
    }

    // 处理请求拦截器
    let requestConfig = mergedConfig
    for (const interceptor of interceptors.request) {
      requestConfig = await interceptor.onFulfilled(requestConfig)
    }

    // 处理 params
    const params = new URLSearchParams(requestConfig.params).toString()
    const finalUrl = `${url}${params ? `?${params}` : ''}`

    // 处理超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout)

    // 发送请求
    const response = await fetch(finalUrl, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      body: requestConfig.data instanceof FormData 
        ? requestConfig.data 
        : JSON.stringify(requestConfig.data),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    // 检查授权状态
    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    // 处理响应拦截器
    let processedResponse = response
    for (const interceptor of interceptors.response) {
      processedResponse = await interceptor.onFulfilled(processedResponse)
    }

    // 处理响应错误
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return processedResponse.json()
  } catch (error) {
    console.error('Request error:', error)
    throw error
  }
}

// 扩展方法
const createMethod = (method: RequestMethod) => 
  <T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method' | 'data'>) => 
    request<T>(url, { ...config, method, data })

// 挂载方法
request.get = createMethod('GET')
request.post = createMethod('POST')

// 挂载配置方法
request.setConfig = (newConfig: Partial<typeof config>) => {
  Object.assign(config, newConfig)
}

// 挂载拦截器方法
request.use = (type: 'request' | 'response', interceptor: Interceptor<any>) => {
  interceptors[type].push(interceptor)
}

export default request