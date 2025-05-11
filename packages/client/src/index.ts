import type {FirebaseApp} from '@firebase/app';
import type {ListenOptions, Unsubscribe} from '@firebase/database';
import type {TransactionOptions} from 'firebase/database';
import {ChildOfDynamicStringKey, TypeOfPathField} from 'better-firebase-rtdb-types-common';

import {
    TypedDatabase,
    TypedDatabaseReference,
    TypedDataSnapshot,
    TypedExistingDataSnapshot,
    TypedThenableReference,
    TypedTransactionResult
} from './typedRtdbClientTypes';

export * from './typedRtdbClientWrappers';
export * from './typedRtdbClientTypes';
export * from './queryBuilder';

// Augment the function signatures of the 'firebase/database' module.
declare module 'firebase/database' {

    export function getDatabase<Base>(app: FirebaseApp): TypedDatabase<Base>;

    export function ref<Base, Path extends string | undefined>(
        db: TypedDatabase<Base>,
        path?: Path
    ): TypeOfPathField<Base, Path extends undefined ? '' : Path> extends void
        ? never
        : TypedDatabaseReference<Base, Path extends undefined ? '' : Path>;

    export function get<Base, Path extends string>(ref: TypedDatabaseReference<Base, Path>): Promise<TypedDataSnapshot<Base, Path>>;

    export function onChildAdded<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        callback: (snapshot: TypedExistingDataSnapshot<Base, `${Path}/${string}`>, previousChildKey?: string | null) => void
    ): Unsubscribe;

    export function onChildChanged<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        callback: (snapshot: TypedExistingDataSnapshot<Base, `${Path}/${string}`>, previousChildKey?: string | null) => void
    ): Unsubscribe;

    export function onChildMoved<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        callback: (snapshot: TypedExistingDataSnapshot<Base, `${Path}/${string}`>, previousChildKey?: string | null) => void
    ): Unsubscribe;

    export function onChildRemoved<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        callback: (snapshot: TypedExistingDataSnapshot<Base, `${Path}/${string}`>) => void
    ): Unsubscribe;

    export function onValue<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        callback: (snapshot: TypedDataSnapshot<Base, Path>) => void,
        cancelCallback?: (error: Error) => unknown,
        listenOptions?: ListenOptions
    ): Unsubscribe;
    export function onValue<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        callback: (snapshot: TypedDataSnapshot<Base, Path>) => void,
        listenOptions: ListenOptions
    ): Unsubscribe;

    export function push<Base, Path extends string, T>(
        parent: TypedDatabaseReference<Base, Path>,
        value: T
    ): T extends ChildOfDynamicStringKey<TypeOfPathField<Base, Path>>
        ? TypedThenableReference<Base, `${Path}/${string}`>
        : never;

    export function set<Base, Path extends string, T>(
        ref: TypedDatabaseReference<Base, Path>,
        value: T
    ): T extends TypeOfPathField<Base, Path>
        ? Promise<void>
        : never;

    export function child<Base, Path extends string, ChildPath extends string>(
        parent: TypedDatabaseReference<Base, Path>,
        path: ChildPath
    ): TypeOfPathField<Base, `${Path}/${ChildPath}`> extends void
        ? never
        : TypedDatabaseReference<Base, `${Path}/${ChildPath}`>;

    export function runTransaction<Base, Path extends string>(
        ref: TypedDatabaseReference<Base, Path>,
        update: (currentValue: TypeOfPathField<Base, Path> | null) => TypeOfPathField<Base, Path> | null | undefined,
        options?: TransactionOptions
    ): Promise<TypedTransactionResult<Base, Path>>;

    // TODO query, startAt, startAfter, endAt, endBefore, equalTo

}
