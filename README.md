# react-native-odoo-jwt

React Native library for Odoo using the Fetch API, JSON-RPC and OpenID JWT.

This library is a fork of previous versions (See [Acknowledgements](#acknowledgements)). Its brings support for authenticating to Odoo with an OpenID JWT, through [foodcoop-odoo-proxy](https://github.com/dehy/foodcoop-odoo-proxy). It is written in TypeScript.

**⚠️ This package is still a work in progress** and hasn't been subjected to proper unit testing.

## Installation

```bash
$ npm install react-native-odoo-jwt
```
or
```bash
$ yarn add react-native-odoo-jwt
```

## Usage

Please refer to the Odoo [API documentation](https://www.odoo.com/documentation/11.0/webservices/odoo.html) if you need help structuring your database queries. I'll try to make a more thorough explanation in the future about how it works.

You need the [odoo-proxy](https://github.com/dehy/foodcoop-odoo-proxy) which will handle the JWT authentication and forward the request to the Odoo server.

**Creating Odoo connection instance**
Before executing any kind of query operations, a connection instance must be established either with a username/password or with a previously retrieved session id.
```js
import Odoo from 'react-native-odoo-jwt'

/* Create new Odoo connection instance */
const odoo = new Odoo({
  host: 'YOUR_PROXY_ADDRESS',
  port: 443, /* Defaults to 443 if not specified */
  protocol: 'https' /* Defaults to https if not specified */
  database: 'YOUR_DATABASE_NAME',
})

```

**Connect**
Before using this lib, you need to have generated a valid JSON Web Token somewhere. You can then pass it to the Odoo instance.

```js
odoo.setToken(jwt_id_token);
```

Connecting directly to Odoo with username/password is not needed, as it is the odoo-proxy who handles it. 

**Get (Odoo Read)**
Receives an Odoo database `model` string and a `params` object containing the `ids` you want to read and the `fields` you want to retrieve from each result.

Returns a promise which resolves to an array of results matching the array of ids provided in the parameters.
```js
/* Get partner from server example */
const  params = {
  ids: [1,2,3,4,5],
  fields: [ 'name' ],
}

odoo.get('res.partner', params, context)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```

**Search & Read items**
Just like the Get method, this one also receives a `model` string and a `params` object. With this method the parameters may include a `domain` array for filtering purposes (with filter statements similar to SQL's `WHERE`),  `limit` and `offset` values for pagination and an `order` property which can be set to specific fields. The array of `ids` becomes optional.

Returns a promised which resolves to an array of results matching the parameters provided.
```js
const  params = {
  ids: [1,2,3,4,5],
  domain: [ [ 'list_price', '>', '50' ], [ 'list_price', '<', '65' ] ],
  fields: [ 'name', 'list_price', 'items' ],
  order:  'list_price DESC',
  limit:  5,
  offset:  0,
}

odoo.search_read('product.product', params, context)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```

**Read Group**
Just like the Search & read, but get the list of records in list view grouped by the given ``groupby`` fields.
If ``lazy`` true, the results are only grouped by the first groupby and the remaining groupbys are put in the __context key.  
If ``lazy`` false, all the groupbys are done in one call.
Returns a promised which resolves to an array of results matching the parameters provided.
Array containing: all the values of fields grouped by the fields in ``groupby`` argument, 
``__domain``: array of list specifying the search criteria, ``__context``: array with argument like ``groupby``
```js
const  params = {
  domain: [ ["project_id", "=", 7] ],
  fields: [ "color", "stage_id" , "sequence"],
  groupby: [
    "stage_id"
  ],
  order:  'sequence',
  lazy: true
}

odoo.read_group('project.task', params, context)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```

**Create**
Receives a `model` string and a `params` object with properties corresponding to the fields you want to write in the row.

```js
odoo.create('delivery.order.line', {
  sale_order_id: 123
  delivered:  'false',
}, context)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```


**Update**
Receives a `model` string, an array of `ids` related to the rows you want to update in the database and a `params` object with properties corresponding to the fields that are going to be updated.

If you need to update several rows in the database you can take advantage of the Promises API to generate and populate an array of promises by iterating through each operation and then resolving all of them using `Promise.all()`
```js
odoo.update('delivery.order.line', [ids], {
  delivered:  'true',
  delivery_note:  'Delivered on time!'
}, context)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```

**Delete**
Receives an Odoo database `model` string and an `ids` array corresponding to the rows you want to delete in the database.

```js
odoo.delete('delivery.order.line', [ids], context)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```

**Custom RPC Call**
If you wish to execute a custom RPC call not represented in this library's methods, you can also run a custom call by passing an `endpoint` string and a `params` object. This requires understanding how the Odoo Web API works more thoroughly so you can properly structure the functions parameters.

```js
odoo.rpc_call('/web/dataset/call_kw', params)
.then(response => { /* ... */ })
.catch(e => { /* ... */ })
```

## References

*  [Odoo ORM API Reference](https://www.odoo.com/documentation/11.0/reference/orm.html)

*  [Odoo Web Service External API](https://www.odoo.com/documentation/11.0/webservices/odoo.html)

## License
This project is licensed under the MIT License - see the  [LICENSE.md](https://github.com/cesar-gutierrez/react-native-odoo/LICENSE.md)  file for details

## Acknowledgements

This project was built upon previous versions. It is a fork of [cesargutierrezo](https://github.com/cesargutierrezo/react-native-odoo-promise-based)'s promised-based version, forked from [kevin3274](https://github.com/kevin3274/react-native-odoo)'s original React Native library which in turn is based of [saidimu](https://github.com/saidimu/odoo)'s Node.js library. 🤪
