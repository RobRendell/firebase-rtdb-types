# Typed Firebase Realtime Database Bindings

This repository provides unofficial, typed Typescript bindings for
the [Firebase Realtime Database](https://firebase.google.com/docs/database) which are better than the ones that come
standard with Firebase, aiming to enhance developer experience and type safety when working with the Firebase Admin (
server-side) and the Firebase Client SDK (in web apps).

The resulting public packages are published to NPM
as [better-firebase-rtdb-types-client](https://www.npmjs.com/package/better-firebase-rtdb-types-client)
and [better-firebase-rtdb-types-server](https://www.npmjs.com/package/better-firebase-rtdb-types-server)

## Packages

This monorepo contains the following packages:

- [`packages/common`](./packages/common): Contains common type definitions and utilities used by both the server and
  client bindings.
- [`packages/server`](./packages/server): Provides strongly-typed bindings specifically for the [Firebase Admin SDK's
  Realtime Database API](https://firebase.google.com/docs/database/admin/start#node.js).
- [`packages/client`](./packages/client): (Coming Soon/In Progress) Contains strongly-typed bindings for the [modular
  Firebase Client SDK's Realtime Database API](https://firebase.google.com/docs/database/web/read-and-write#web_2).

