import {ChildOfDynamicStringKey, TypeOfPathField, ValidPath} from 'better-firebase-rtdb-types-common';
import {TypedDatabase, TypedDatabaseReference, TypedThenableReference} from './typedRtdbClientTypes';
import {child as firebaseChild, push as firebasePush, ref as firebaseRef, set as firebaseSet} from 'firebase/database';

export function ref<Base, Path extends ValidPath<Base> | undefined>(
    db: TypedDatabase<Base>,
    path?: Path
) {
    return firebaseRef(db, path) as TypeOfPathField<Base, Path extends undefined ? '' : Path> extends void
        ? never
        : TypedDatabaseReference<Base, Path extends undefined ? '' : Path>;
}

export function child<Base, Path extends string, ChildPath extends ValidPath<TypeOfPathField<Base, Path>>>(
    parent: TypedDatabaseReference<Base, Path>,
    path: ChildPath
) {
    return firebaseChild(parent, path) as TypeOfPathField<Base, `${Path}/${ChildPath}`> extends void
        ? never : TypedDatabaseReference<Base, `${Path}/${ChildPath}`>
}

export function push<Base, Path extends string>(
    parent: TypedDatabaseReference<Base, Path>,
    value: ChildOfDynamicStringKey<TypeOfPathField<Base, Path>>
) {
    return firebasePush(parent, value) as TypeOfPathField<Base, `${Path}/${string}`> extends void
        ? never : TypedThenableReference<Base, `${Path}/${string}`>;
}

export async function set<Base, Path extends string>(
    ref: TypedDatabaseReference<Base, Path>,
    value: TypeOfPathField<Base, Path>
) {
    return firebaseSet(ref, value);
}

