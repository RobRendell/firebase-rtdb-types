import type {FirebaseApp} from '@firebase/app';
import type {Unsubscribe} from '@firebase/database';
import type {Database, DatabaseReference, DataSnapshot, TransactionOptions} from 'firebase/database';
import {
    child as firebaseChild,
    get as firebaseGet,
    getDatabase as firebaseGetDatabase,
    onChildAdded as firebaseOnChildAdded,
    onChildRemoved as firebaseOnChildRemoved,
    push as firebasePush,
    ref as firebaseRef,
    remove as firebaseRemove,
    runTransaction as firebaseRunTransaction,
    set as firebaseSet
} from 'firebase/database';
import {ChildOfDynamicStringKey, TypeOfPathField} from 'better-firebase-rtdb-types-common';

// Export wrappers for client RTDB Firebase functions which can infer the type of values accessed in the DB based on the
// `Base` type declared when calling `getDatabase()` and the string paths used to access them.

export type TypedDatabase<Base> = Database & {__base?: Base};

export function getDatabase<Base = never>(app: FirebaseApp) {
    return firebaseGetDatabase(app) as TypedDatabase<Base>;
}

export type TypedDatabaseReference<T, Base> = DatabaseReference & {__type?: T, __base?: Base};

export function ref<Path extends string, Base>(db: TypedDatabase<Base>, path: Path) {
    return firebaseRef(db, path) as TypedDatabaseReference<TypeOfPathField<Base, Path>, Base>;
}

export interface TypedDataSnapshot<T, Base, Exists extends boolean = boolean> extends DataSnapshot {
    child<P extends string>(path: P): TypedDataSnapshot<TypeOfPathField<T, P>, Base>;
    forEach(action: (a: TypedDataSnapshot<T[keyof T], Base, true>) => boolean | void): boolean;
    ref: TypedDatabaseReference<T, Base>;
    exists(this: TypedDataSnapshot<T,  Base, Exists>): this is TypedDataSnapshot<T,  Base, true>;
    val(): Exists extends true ? T : Exists extends false ? null : T | null;

    key: Exists extends true ? string : Exists extends false ? null : string | null;
}

export function get<T, Base>(ref: TypedDatabaseReference<T, Base>) {
    return firebaseGet(ref) as Promise<TypedDataSnapshot<T, Base>>;
}

export function onChildAdded<T, Base>(
    ref: TypedDatabaseReference<T, Base>,
    callback: (snapshot: TypedDataSnapshot<T[keyof T], Base, true>, previousChildName?: string | null) => void
): Unsubscribe {
    return firebaseOnChildAdded(ref, callback as (snapshot: DataSnapshot, previousChildName?: string | null) => void);
}

export function onChildRemoved<T, Base>(
    ref: TypedDatabaseReference<T, Base>,
    callback: (snapshot: TypedDataSnapshot<T[keyof T], Base, true>) => void
): Unsubscribe {
    return firebaseOnChildRemoved(ref, callback as (snapshot: DataSnapshot) => void);
}

export type TypedThenableReference<T, Base> = TypedDatabaseReference<T, Base> & Promise<TypedDatabaseReference<T, Base>>;

export function push<T, Base>(
    parent: TypedDatabaseReference<T, Base>,
    value: ChildOfDynamicStringKey<T>
) {
    return firebasePush(parent, value) as TypedThenableReference<T, Base>;
}

export async function set<T, Base>(
    ref: TypedDatabaseReference<T, Base>,
    value: T
) {
    return firebaseSet(ref, value);
}

export function child<T, Base, Path extends string>(
    parent: TypedDatabaseReference<T, Base>,
    path: Path
) {
    return firebaseChild(parent, path) as TypedDatabaseReference<TypeOfPathField<T, Path>, Base>;
}

export function remove<T extends object, Base>(
    ref: TypedDatabaseReference<T, Base>
) {
    return firebaseRemove(ref);
}

export function runTransaction<T, Base>(
    ref: TypedDatabaseReference<T, Base>,
    update: (currentValue: T | null) => T | undefined,
    options?: TransactionOptions
) {
    return firebaseRunTransaction(ref, update, options);
}