# Typed Firebase Realtime Database Bindings - Server

This package provides **unofficial** strongly-typed Typescript bindings for
the [Firebase Admin SDK's Realtime Database API](https://firebase.google.com/docs/database/admin/start#node.js). These
bindings are better than the ones that come standard with Firebase, validating the string paths used to access data and
inferring the type of the data stored there.

The core to using `better-firebase-rtdb-types-server` lies in you defining a base TypeScript type that accurately
represents the structure of your Firebase Realtime Database at the root level. This is used as the generic parameter for
this package's exported `TypedDatabase` type.

Once you assign your Firebase `database` instance to a variable of type `TypedDatabase` with a generic parameter of your
base type, subsequent accesses to the database using that variable will be strongly typed.

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

  /* const ref = */ rtdb.ref('book');
  // ❌ Error: Argument of type 'book' is not assignable to a parameter of type 'books' | `books/${string}`

  const ref = rtdb.ref('books');
  // ✔️ has type TypedReference<MyRootRtdbDataStructure, 'books'>

  /* const snapshot = */ await ref.orderByChild('name').get();
  // ❌ Error: Argument of type 'name' is not assignable to a parameter of type 'title' | 'author' | 'year'

  /* const snapshot = */ await ref.orderByChild('title').startAt(42).get();
  // ❌ Error: Argument of type `number` is not assignable to a parameter of type `string`

  const snapshot = await ref.orderByChild('title').startAt('All Systems Red').get();
  // ✔️ has type TypedDataSnapshot<MyRootRtdbDataStructure, 'books'>

  snapshot.forEach((childSnapshot) => {
    // ✔️ childSnapshot has type TypedExistingDataSnapshot<MyRootRtdbDataStructure, 'books/${string}'>
    const value = childSnapshot.val();
    // ✔️ has type `Book`
    console.log(`Title: "${value.title}", Author: ${value.author}`);
  });

  // Paths more than a single level deep aren't enumerated, but are validated via the return type.
  const badDeepRef = rtdb.ref('books/bZ3zFrG/published');
  // ❌ has type `never`

  const deepRef = rtdb.ref('books/bZ3zFrG/year');
  // ✔️ has type TypedReference<MyRootRtdbDataStructure, 'books/bZ3zFrG/year'>

  const deepSnapshot = await deepRef.get();
  // ✔️ has type TypedDataSnapshot<MyRootRtdbDataStructure, 'books/bZ3zFrG/year'>

  const uncheckedValue = deepSnapshot.val();
  // ✔️ `deepSnapshot` may not exist, so has type `number | null`
  console.log(uncheckedValue);

  if (deepSnapshot.exists()) {
    // Type of deepSnapshot has been narrowed to TypedExistingDataSnapshot<MyRootRtdbDataStructure, 'books/bZ3zFrG/year'>
    const checkedValue = deepSnapshot.val();
    // ✔️ `deepSnapshot` exists, so val() returns a type of `number`
    console.log(checkedValue);
  }

  await deepRef.set('abc');
  // ❌ Error: Argument of type `string` is not assignable to a parameter of type `number`

  await deepRef.set(2017);
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
// Will always have a value of undefined, but has type `undefined | (whatever data type can exist at the nominated path)`

```

## Known Issues

* **Constant String Paths**: The Typescript types rely on the string paths used to address the database having types
  more specific than `string`. You can use string interpolation to create a const string with variable parts, but if you
  pass a variable which is simply a `string` as a path parameter to one of the methods used to address the data in the
  database, Typescript will be unable to infer anything about the type stored there.
* **Deep Paths**: Path parameters passed to methods to access a location in the database (such as `child()` and `ref()`)
  are constrained to match one of the direct keys of the current location, or (for objects nested more deeply) one of
  the keys followed by a slash and an arbitrary string. In the latter case, the provided path is still validated, and if
  invalid the return value of the method is of type `never`. The above example of `badDeepRef` demonstrates this
  scenario.
* **Type Inference of Non Existence**: The negative case of `TypedSnapshot.exists()` is not inferred. Typescript knows
  that if the snapshot exists, then `val()` and `key` are non-null, but it doesn't consequently infer that they are
  always null if the snapshot does not exist.
* **Typescript**: Depending on the complexity of your database schema and how deeply nested your paths are, you might
  encounter some limitations in TypeScript's ability to perfectly infer types for very long and dynamic paths.
* **Server Specific Values**: Sometimes you will need to break the type rules. For example, the sentinel value
  `ServerValue.TIMESTAMP` is an Object, but is assigned to timestamp (number) fields. This can be worked around by
  casting the sentinel, e.g. `await timestampRef.set(database.ServerValue.TIMESTAMP as number);`.

## See Also

There is a corresponding NPM
package [better-firebase-rtdb-types-client](https://www.npmjs.com/package/better-firebase-rtdb-types-client)
which provides the same functionality for the Firebase web client.

