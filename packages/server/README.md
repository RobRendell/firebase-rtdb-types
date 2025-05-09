# Typed Firebase Realtime Database Bindings - Server

This package provides **unofficial** strongly-typed Typescript bindings for
the [Firebase Admin SDK's Realtime Database API](https://firebase.google.com/docs/database/admin/start#node.js). These
bindings are better than the ones that come standard with Firebase, validating the string paths used to access data and
inferring the type of the data stored there.

The core to using `better-firebase-rtdb-types-server` lies in you defining a TypeScript type that accurately represents
the structure of your Firebase Realtime Database at the root level. This is used as the generic parameter for this
package's exported `TypedDatabase` type.

Once you assign your Firebase `database` instance to a variable of type `TypedDatabase` with a generic parameter of your
root type, subsequent accesses to the database using that variable will be strongly typed.

## Installation

This package has a peer dependency on firebase-admin (version 13).

```bash
npm install better-firebase-rtdb-types-server firebase-admin
# or
yarn add better-firebase-rtdb-types-server firebase-admin
# or
pnpm add better-firebase-rtdb-types-server firebase-admin
```

## Usage

```typescript
import type {TypedDatabase} from 'better-firebase-rtdb-types-server';
import {database} from 'firebase-admin';

// ...

type Book = {
    title: string;
    author: string;
    year: number;
}

type MyRootRtdbDataStructure = {
    books: {
        [key: string]: Book;
    }
}

// Set the type of the database to a TypedDatabase, with a generic type describing the shape of the RTDB data.
const rtdb = database(firebaseApp) as TypedDatabase<MyRootRtdbDataStructure>;

async function demo() {

    const errorRef = rtdb.ref('book');
    // ❌ Error: Argument of type 'book' is not assignable to a parameter of type `never`

    const goodRef = rtdb.ref('books');
    // ✔️ has type TypedReference<MyRootRtdbDataStructure, 'books'>

    const errorSnapshot1 = await goodRef.orderByChild('name').get();
    // ❌ Error: Argument of type 'name' is not assignable to a parameter of type `never`

    const errorSnapshot2 = await goodRef.orderByChild('title').startAt(42).get();
    // ❌ Error: Argument of type `number` is not assignable to a parameter of type `string`

    const goodSnapshot = await goodRef.orderByChild('title').startAt('All Systems Red').get();
    // ✔️ has type TypedDataSnapshot<MyRootRtdbDataStructure, 'books'>

    goodSnapshot.forEach((childSnapshot) => {
        // ✔️ childSnapshot has type TypedDataSnapshot<MyRootRtdbDataStructure, 'books/*'>
        const value = childSnapshot.val();
        // ✔️ has type `Book`
        console.log(`Title: "${value.title}", Author: ${value.author}`);
    });

    const errorDeepRef = rtdb.ref('books/bZ3zFrG/published');
    // ❌ Error: Argument of type 'books/bZ3zFrG/published' is not assignable to a parameter of type `never`

    const goodDeepRef = rtdb.ref('books/bZ3zFrG/year');
    // ✔️ has type TypedReference<MyRootRtdbDataStructure, 'books/bZ3zFrG/year'>

    const deepSnapshot = await goodDeepRef.get();
    // ✔️ has type TypedDataSnapshot<MyRootRtdbDataStructure, 'books/bZ3zFrG/year'>

    const uncheckedValue = deepSnapshot.val();
    // ✔️ `deepSnapshot` may not exist, so has type `number | null`

    if (deepSnapshot.exists()) {
        const checkedValue = deepSnapshot.val();
        // ✔️ `deepSnapshot` exists, so val() returns a type of `number`
        console.log(checkedValue);
    }

    await goodDeepRef.set('abc');
    // ❌ Error: Argument of type `string` is not assignable to a parameter of type `number`

    await goodDeepRef.set(2017);
    // ✔️ Set the `year` field with a valid value

}

```

### __type Variable

For potential developer convenience and enhanced IDE support, both `TypedDataSnapshot` and `TypedReference` include an
optional `__type` field. While this field is never populated at runtime (it will always be undefined), your IDE's
TypeScript language service might be able to infer and display the specific type of the data or reference at that point
in your code. This can be useful for understanding the inferred types as you navigate your database structure.

```typescript

const childRef = typedRef.child('some/path');

childRef.__type
// Will always be undefined, but has type `undefined | (whatever data type can exist at the nominated path)`

```

## Known Issues

* **Constant String Paths**: The Typescript types rely on the string paths used to address the database having types
  more specific than `string`. You can use string interpolation to create a const string with variable parts, but if you
  pass a variable which is simply a `string` as a path parameter to one of the methods used to address the data in the
  database, Typescript will be unable to infer anything about the type stored there.
* **Type Inference of Non Existence**: The negative case of `TypedSnapshot.exists()` is not inferred. Typescript knows
  that if the snapshot exists, then `val()` and `key` are non-null, but it doesn't consequently infer that they are
  always null if the snapshot does not exist.
* **Iterating Child Elements**: Methods which are used to iterate children require that you perform them on a part of
  the type which is indexed with a string. The path will be extended with a `*` character to represent the unknown key.
  This can be seen in the example above calling `goodSnapshot.forEach` - the callback's Path parameter is 'books/*', so
  the `MyRootRtdbDataStructure` type is indexed with `books` and then the arbitrary string `*` to arrive at the type
  `Book`. You therefore cannot use these methods to iterate a type with fixed keys. The methods with this behaviour are:
    * `DataSnapshot.forEach`
    * `Reference.orderByChild`
    * `Reference.on('child_added' | 'child_removed' | 'child_changed' | 'child_moved', ...)`
    * `Reference.once('child_added' | 'child_removed' | 'child_changed' | 'child_moved', ...)`
* **Deeply Nested Paths**: Depending on the complexity of your database schema and how deeply nested your paths are, you
  might encounter some limitations in TypeScript's ability to perfectly infer types for very long and dynamic paths.
* **Server Specific Values**: Sometimes you will need to break the type rules. For example, the sentinel value
  `ServerValue.TIMESTAMP` is an Object, but is assigned to timestamp (number) fields. This can be worked around by
  casting the sentinel, e.g. `await timestampRef.set(database.ServerValue.TIMESTAMP as number);`.

## See Also

There is a corresponding NPM
package [better-firebase-rtdb-types-client](https://www.npmjs.com/package/better-firebase-rtdb-types-client)
which provides the same functionality for the Firebase web client.

