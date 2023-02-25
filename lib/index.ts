'use strict'

type Config = {
  endpoint: URL;
}

type Params = {
  domain?: Array<Array<string|number|Array<number>>>,
  ids?: number[],
  fields?: string[],
  offset?: number,
  limit?: number,
  order?: string,
  groupby?: string,
  lazy?: boolean,
}

type XpcParams = {
  kwargs: {
    context?: object,
  } & Params,
  model: string,
  method: string,
  args: Array<any>
}

type Response = {
  success: boolean,
  error?: string,
  data?: any,
}

export default class Odoo {

  endpoint: URL;
  authToken?: string;

  context?: object;

  constructor (config: Config) {
    config = config || {}

    this.endpoint = config.endpoint;
  }

  setToken = (token?: string) => {
    this.authToken = token;
  }

  // Search records
  search = (model: string, params: Params, context?: object) => {
    return this._request('/web/dataset/call_kw', {
      kwargs: {
        context: context
      },
      model: model,
      method: 'search',
      args: [
        params.domain,
      ],
    })
  }

  // Search & Read records
  search_read = (model: string, params: Params, context?: object) => {
    return this._request('/web/dataset/call_kw', {
      model: model,
      method: 'search_read',
      args: [],
      kwargs: {
        context: context,
        domain: params.domain,
        offset: params.offset,
        limit: params.limit,
        order: params.order,
        fields: params.fields,
      },
    })
  }

  // Read records
  get = (model: string, params: Params, context?: object) => {
    return this._request('/web/dataset/call_kw', {
      model: model,
      method: 'read',
      args: [
        params.ids,
      ],
      kwargs: {
        context: context,
        fields: params.fields,
      },
    })
  }

  // Read Group
  read_group = (model: string, params: Params, context?: object) => {
    return this._request("/web/dataset/call_kw", {
      model: model,
      method: "read_group",
      args: [],
      kwargs: {
        context: context,
        domain: params.domain,
        fields: params.fields,
        groupby: params.groupby,
        lazy: params.lazy,
        order: params.order
      },
    })
  }

  // Browse records by ID
  // Not a direct implementation of Odoo RPC 'browse' but rather a workaround based on 'search_read'
  browse_by_id = (model: string, params: Params) => {
    params.domain = [['id', '>', '0']]
    this.search_read(model, params)
      .then(function (response) {
        return response
      })
  }


  // Create records
  create = (model: string, params: Params, context?: object) => {
    return this._request('/web/dataset/call_kw', {
      kwargs: {
        context: {...context, ...context}
      },
      model: model,
      method: 'create',
      args: [params]
    })
  }

  // Update records
  update = (model: string, ids: number[], params: Params, context?: object) => {
    if (ids) {
      return this._request('/web/dataset/call_kw', {
        kwargs: {
          context: {...context, ...context}
        },
        model: model,
        method: 'write',
        args: [ids, params]
      })
    }
  }

  // Delete records
  delete = (model: string, ids: number[], context?: object) => {
    if (ids) {
      return this._request('/web/dataset/call_kw', {
        kwargs: {
          context: {...context, ...context}
        },
        model: model,
        method: 'unlink',
        args: [ids]
      })
    }
  }

  // Generic RPC wrapper
  rpc_call = (endpoint: string, model: string, method: string, args: any, params: Params) => {
    return this._request(endpoint, {
      kwargs: {
        ...params,
      },
      model: model,
      method: method,
      args: args,
    })
  }

  // Private functions
  _request = async (path: string, params: XpcParams): Promise<Response> => {
    params = params || {}

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    if (this.authToken) {
      headers.append('X-Auth-Token', this.authToken);
    }

    var url = `${this.endpoint.toString()}${path || '/'}`;
    var options: RequestInit = {
      method: 'POST',
      headers: headers,
      credentials: 'omit',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: new Date().getUTCMilliseconds(),
        method: 'call',
        params: params
      })
    }

    return fetch(url, options)
      .then(function (response) {
        return response.json()
      })
      .then(function (responseJson) {
        if (responseJson.error) return { success: false, error: responseJson.error }
        else return { success: true, data: responseJson.result }
      })
      .catch(function (error) {
        return { success: false, error: error }
      });
  }
}

export { 
  Response,
};