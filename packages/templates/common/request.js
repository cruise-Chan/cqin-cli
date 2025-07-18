const config = {
    baseURL: '',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  const interceptors = {
    request: [],
    response: []
  }
  
  const request = async (url, options = {}) => {
    try {
      const mergedConfig = {
        ...config,
        ...options,
        headers: { ...config.headers, ...options.headers }
      }
  
      let requestConfig = mergedConfig
      for (const interceptor of interceptors.request) {
        requestConfig = await interceptor.onFulfilled(requestConfig)
      }
  
      const params = new URLSearchParams(requestConfig.params).toString()
      const finalUrl = `${requestConfig.baseURL}${url}${params ? `?${params}` : ''}`
  
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout)
  
      const response = await fetch(finalUrl, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        body: requestConfig.data instanceof FormData 
          ? requestConfig.data 
          : JSON.stringify(requestConfig.data),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
  
      if (response.status === 401) {
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }
  
      let processedResponse = response
      for (const interceptor of interceptors.response) {
        processedResponse = await interceptor.onFulfilled(processedResponse)
      }
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      return processedResponse.json()
    } catch (error) {
      console.error('Request error:', error)
      throw error
    }
  }
  
  const createMethod = (method) => (url, data, config) => 
    request(url, { ...config, method, data })
  
  request.get = createMethod('GET')
  request.post = createMethod('POST')
  
  request.setConfig = (newConfig) => {
    Object.assign(config, newConfig)
  }
  
  request.use = (type, interceptor) => {
    interceptors[type].push(interceptor)
  }
  
  export default request