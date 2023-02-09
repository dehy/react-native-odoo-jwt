'use strict'

type Config = {
  host: string,
  port: number,
  database: string,
  username?: string,
  password?: string,
  sid?: string,
  protocol?: string,
}

type Params = {
  domain: Array<Array<string>>,
  ids: number[],
  fields: string[],
  offset: number,
  limit: number,
  order: string,
  groupby: string,
  lazy: boolean,
}

type XpcParams = {
  kwargs: {
    context: any,
  },
  model: string,
  method: string,
  args: Array<any>
}

const Odoo = (config: Config) => {
  config = config || {}

  const host = config.host
  const port = config.port || 80
  const database = config.database
  let username = config.username || null
  const password = config.password || null
  let sid: string | null | undefined = config.sid || null
  const protocol = config.protocol || 'http'
  let authToken: string | undefined;

  let cookie: string | null = null;
  let uid: string | null;
  let session_id: string | null;
  let context: string | null;

  let useCookie: boolean = true;

  Odoo.prototype.setToken = (token?: string) => {
    authToken = token;
    useCookie = token === undefined;
  }

  // Connect
  Odoo.prototype.connect = () => {
    var params = {
      db: database,
      login: username,
      password: password
    }

    var json = JSON.stringify({ params: params })
    var url = `${protocol}://${host}:${port}/web/session/authenticate`

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Content-Length', json.length.toString());

    var options: RequestInit = {
      method: 'POST',
      headers: headers,
      body: json,
      credentials: 'omit'
    }

    return fetch(url, options)
      .then(function (response) {
        if (useCookie) {
          sid = response.headers.get('set-cookie')?.split(';')[0].split('=')[1];
          cookie = response.headers.get('set-cookie');
        } else {
          sid = null;
          cookie = null;
        }
        return response.json()
      })
      .then(function (responseJson) {
        if (responseJson.error) return { success: false, error: responseJson.error }
        else {
          uid = responseJson.result.uid
          session_id = responseJson.result.session_id
          context = responseJson.result.user_context
          username = responseJson.result.username
          return { success: true, data: responseJson.result }
        }
      })
      .catch(function (error) {
        return { success: false, error: error }
      })
  }

  // Search records
  Odoo.prototype.search = (model: string, params: Params, context: object) => {
    return Odoo.prototype._request('/web/dataset/call_kw', {
      kwargs: {
        context: {...context, ...context}
      },
      model: model,
      method: 'search',
      args: [
        params.domain,
      ],
    })
  }

  // Search & Read records
  Odoo.prototype.search_read = (model: string, params: Params, context) => {
    return Odoo.prototype._request('/web/dataset/call_kw', {
      model: model,
      method: 'search_read',
      args: [],
      kwargs: {
        context: {...context, ...context},
        domain: params.domain,
        offset: params.offset,
        limit: params.limit,
        order: params.order,
        fields: params.fields,
      },
    })
  }

  // Read records
  Odoo.prototype.get = (model: string, params: Params, context) => {
    return Odoo.prototype._request('/web/dataset/call_kw', {
      model: model,
      method: 'read',
      args: [
        params.ids,
      ],
      kwargs: {
        context: {...context, ...context},
        fields: params.fields,
      },
    })
  }

  // Read Group
  Odoo.prototype.read_group = (model: string, params: Params, context) => {
    return Odoo.prototype._request("/web/dataset/call_kw", {
      model: model,
      method: "read_group",
      args: [],
      kwargs: {
        context: { ...context, ...context },
        domain: params.domain,
        fields: params.fields,
        groupby: params.groupby,
        lazy: params.lazy,
        orderby: params.order
      },
    })
  }

  // Browse records by ID
  // Not a direct implementation of Odoo RPC 'browse' but rather a workaround based on 'search_read'
  Odoo.prototype.browse_by_id = (model: string, params: Params) => {
    params.domain = [['id', '>', '0']]
    Odoo.prototype.search_read(model, params, context)
      .then(function (response) {
        return response
      })
  }


  // Create records
  Odoo.prototype.create = (model: string, params: Params, context) => {
    return Odoo.prototype._request('/web/dataset/call_kw', {
      kwargs: {
        context: {...context, ...context}
      },
      model: model,
      method: 'create',
      args: [params]
    })
  }

  // Update records
  Odoo.prototype.update = (model: string, ids: number[], params: Params, context) => {
    if (ids) {
      return Odoo.prototype._request('/web/dataset/call_kw', {
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
  Odoo.prototype.delete = (model: string, ids: number[], context) => {
    if (ids) {
      return Odoo.prototype._request('/web/dataset/call_kw', {
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
  Odoo.prototype.rpc_call = (endpoint: string, params: Params) => {
    return Odoo.prototype._request(endpoint, params)
  }

  // Private functions
  Odoo.prototype._request = (path: string, params: XpcParams) => {
    params = params || {}

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    if (cookie) {
      headers.append('Cookie', cookie);
    }
    if (authToken) {
      headers.append('X-Auth-Token', authToken);
    }

    var url = `${protocol}://${host}:${port}${path || '/'}`
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
      })
}
}

export default Odoo;
