# Typed Firebase Realtime Database Bindings - Client

This package provides **unofficial** strongly-typed Typescript bindings for the [modular Firebase Client SDK's Realtime
Database API](https://firebase.google.com/docs/database/web/read-and-write#web_2). These types are better than the
ones that come standard with Firebase, validating the string paths used to access data and inferring the type of the
data stored there.

The core to using `better-firebase-rtdb-types-client` lies in you defining a base TypeScript type that accurately
represents the structure of your Firebase Realtime Database at the root level. Providing your base type as a generic
type parameter to `getDatabase()` will cause Typescript to use this module's type definitions, resulting in the instance
being of type `TypedDatabase`.

Passing this `TypedDatabase` instance to calls to the modular Firebase functions will use this package's type overrides
for the original firebase database modular functions, giving strong typing on your database accesses.

## IMPORTANT LIMITATION

Because of the way Typescript merges types, this package is unable to completely override the original type definitions
of the firebase database functions to enforce type safety. If this package's overrides actually enforced the parameter
types properly, then any parameters in your code with incorrect types passed to certain functions would cause Typescript
to fall back on the original, more permissive function signatures exported by 'firebase/database', and no error would be
reported.

This problem arises with these functions:

* `ref()` and `child()`: these functions take `path` parameters which should be constrained to only valid
  slash-separated sequences of keys.
* `set()` and `push()`: these functions take `value` parameters which should match the expected type of the data
  addressed by the supplied TypedDatabaseReference.

As a result, this package's signature overrides of those functions have permissive parameters, allowing any path/value
to be supplied to the call, to avoid falling back on the original signature. Instead, to enforce type safety, these four
overridden function signatures change the return types of these functions to be of type `never` in the case where the
relevant parameter is of the wrong type.

Since the return value of `push` and especially `set` is not generally read by user code, it is recommended that you
configure the ESLint rule [await-thenable](https://typescript-eslint.io/rules/await-thenable/) to report `await`ing a
value with a non-Thenable type like `never` as an error.

This package also exports its own wrapped versions of those four functions, which you can use instead of the functions
exported from 'firebase/database' to get errors reported directly on the parameters when your types are incorrect. These
are exported with the same names as those from 'firebase/database' ('ref', 'child', 'set' and 'push') to ease migration
of existing code to a type-safe version. You are unlikely to need to import both versions of one of these function in
the same file, since most users will either choose to keep using the 'firebase/database' versions without parameter
validation, or switch to using the wrapped versions. The demo code below is artificial in that regard, importing both
versions of `ref` for demonstration purposes only.

## Installation

This package has a peer dependency on firebase (version 11).

```bash
npm install better-firebase-rtdb-types-client firebase
# or
yarn add better-firebase-rtdb-types-client firebase
# or
pnpm add better-firebase-rtdb-types-client firebase
```

## Usage

```typescript
import {get, getDatabase, ref as firebaseRef} from 'firebase/database';
import {ref, set} from 'better-firebase-rtdb-types-client';

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

// By setting a generic type parameter describing your database structure on the getDatabase call, the value returned
// will be this package's `TypedDatabase`.
const rtdb = getDatabase<MyRootRtdbDataStructure>(firebaseApp);

async function demo() {

    // The original `ref` and 'child' functions exported from 'firebase/database' will allow any string as a path, but
    // will return `never` if the path is invalid. See the IMPORTANT LIMITATION section above.
    const invalidRef1 = firebaseRef(rtdb, 'book');
    // ❌ Error: invalidRef is of type `never`

    // If you want validation on the path parameter to 'ref' or 'child', use this module's versions.
    const invalidRef2 = ref(rtdb, 'book');
    // ❌ Error: Argument of type 'book' is not assignable to a parameter of type 'books' | `books/${string}` | undefined

    // If the path is valid, `ref` from either this module and 'firebase/database' will work.
    const booksRef = firebaseRef(rtdb, 'books'); // also works with ref(rtdb, 'books')
    // ✔️ has type TypedDatabaseReference<MyRootRtdbDataStructure, 'books'>

    const snapshot = await get(booksRef);
    // ✔️ has type TypedDataSnapshot<MyRootRtdbDataStructure, 'books'>

    snapshot.forEach((childSnapshot) => {
        // ✔️ childSnapshot has type TypedExistingDataSnapshot<MyRootRtdbDataStructure, 'books/${string}'>
        const value = childSnapshot.val();
        // ✔️ has type `Book`
        console.log(`Title: "${value.title}", Author: ${value.author}`);
    });

    // Path parameters more than a single level deep aren't enumerated, but are still validated via the return type.
    const badDeepRef = ref(rtdb, 'books/bZ3zFrG/published');
    // ❌ has type `never`

    const deepRef = ref(rtdb, 'books/bZ3zFrG/year');
    // ✔️ has type TypedReference<MyRootRtdbDataStructure, 'books/bZ3zFrG/year'>

    const deepSnapshot = await get(deepRef);
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

    // For `set` and `push`, to get validation on the value parameter you need to use this module's wrapped versions.
    await set(deepRef, 'abc');
    // ❌ Error: Argument of type `string` is not assignable to a parameter of type `number`

    await set(deepRef, 2017);
    // ✔️ Set the `year` field with a valid value

}

```

### Query methods

The approach the modular Firebase client `query` method takes
to [sort and filter data](https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data) is not
well suited to static typing. The method takes a variable number of constraints as arguments, and the semantics of the
constraint methods change depending on what occurs earlier in the list. For instance, a well-typed version of the
constraint function `startAt(value)` should limit the type of the `value` parameter, but the valid type of this
parameter changes, depending on the most recent orderBy* constraint prior to the `startAt`. If `startAt` occurs after a
call to `orderByKey()` for example, then `value` have a type of `string`, but if it occurs after a call to
`orderByPriority()` then it has a type of `string | number | null`.

As a result, it is not possible to do type checking on code that uses the standard `query` method. Instead, this module
exposes a builder approach to constructing queries, which is more amenable to strongly typing the constraints (as each
function in the chain can return a new type, affecting all subsequent calls).

```typescript
import {queryBuilder} from 'better-firebase-rtdb-types-client';

// Original code, using the modular `query` method, which is not strongly typed even with this module as a dependency.
// const query = query(ref(rtdb, 'books'), orderByChild('year'), startAt(2015));

const query = queryBuilder(ref(rtdb, 'books'))
        // .with(orderByChild('published')) // ❌ Error: Type 'published' is not assignable to type 'title' | 'author' | 'year'
        .with(orderByChild('year'))
        // .with(startAt('abc')) // ❌ Error: Type 'string' is not assignable to type 'number'
        .with(startAt(2015))
        .toQuery();

```

This builder approach still tree-shakes well, as it uses the original modular orderBy* and start/end methods as
parameters to the `with` method to build up its list of constraints. The builder code makes no reference to individual
constraint methods internally, so any that are unused in your code will be omitted from your bundle.

### __type Variable

For potential developer convenience and enhanced IDE support, both `TypedDataSnapshot` and `TypedDatabaseReference`
include an optional `__type` field. While this field is never populated at runtime (it will always be undefined), your
IDE's TypeScript language service might be able to infer and display the specific type of the data or reference at that
point in your code. This can be useful for understanding the inferred types as you navigate your database structure.

```typescript

const childRef = child(rtdb, 'some/path');

childRef.__type
// Will always have a value of undefined, but has type `undefined | (whatever data type can exist at the nominated path)`

```

## Known Issues

* **Firebase Functions With Invalid Parameters**: See the IMPORTANT LIMITATION in the first section.
* **Constant String Paths**: The Typescript types rely on the string paths used to address the database having types
  more specific than `string`. You can use string interpolation to create a const string with variable parts, but if you
  pass a variable which is simply a `string` as a path parameter to one of the methods used to address the data in the
  database, Typescript will be unable to infer anything about the type stored there.
* **Deep Paths**: Path parameters to access a location in the database passed to the wrapped methods `child` and `ref`
  are constrained to match one of the direct keys of the current location, or (for objects nested more deeply) one of
  the keys followed by a slash and an arbitrary string. In the latter case, the provided path is still validated, and if
  invalid the return value of the method is of type `never`. The above example of `badDeepRef` demonstrates this
  scenario.
* **Type Inference of Non Existence**: The negative case of `TypedSnapshot.exists()` is not inferred. Typescript knows
  that if the snapshot exists, then `val()` and `key` are non-null, but it doesn't consequently infer that they are
  always null if the snapshot does not exist.
* **Typescript**: Depending on the complexity of your database schema and how deeply nested your paths are, you might
  encounter some limitations in TypeScript's ability to perfectly infer types for very long and dynamic paths.

## See Also

There is a corresponding NPM
package [better-firebase-rtdb-types-server](https://www.npmjs.com/package/better-firebase-rtdb-types-server)
which provides the same functionality for the Firebase Admin SDK, used in Firebase functions or server-side code.

