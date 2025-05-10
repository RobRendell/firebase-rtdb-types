import {Database, DatabaseReference, DataSnapshot, type TransactionResult} from 'firebase/database';
import {Query} from '@firebase/database';
import {ParentPath, TypeOfPathField, ValidPath} from 'better-firebase-rtdb-types-common';

export type TypedDatabase<Base> = Database & {__base?: Base};

export interface TypedQuery<Base, Path extends string, S = never> extends Query {
    ref: TypedDatabaseReference<Base, Path, S>;
}

export interface TypedDatabaseReference<Base, Path extends string, S = never> extends Omit<DatabaseReference, keyof Query>, TypedQuery<Base, Path, S> {
    parent: Path extends '' ? null : TypedDatabaseReference<Base, ParentPath<Path>>;
    root: TypedDatabaseReference<Base, ''>;
}

export interface TypedDataSnapshot<Base, Path extends string> extends DataSnapshot {
    child<ChildPath extends ValidPath<TypeOfPathField<Base, Path>>>(path: ChildPath): TypedDataSnapshot<Base, `${Path}/${ChildPath}`>;
    forEach(action: (a: TypedExistingDataSnapshot<Base, `${Path}/${string}`>) => boolean | void): boolean;
    ref: TypedDatabaseReference<Base, Path>;
    exists(this: TypedDataSnapshot<Base, Path>): this is TypedExistingDataSnapshot<Base, Path>;
    val(): TypeOfPathField<Base, Path> | null;

    key: string | null;
}

export interface TypedExistingDataSnapshot<Base, Path extends string> extends TypedDataSnapshot<Base, Path> {
    val(): TypeOfPathField<Base, Path>;
    key: string;
}

export type TypedThenableReference<Base, Path extends string> = TypedDatabaseReference<Base, Path>
    & {key: string}
    & Promise<TypedDatabaseReference<Base, Path>>;

export interface TypedTransactionResult<Base, Path extends string> extends TransactionResult {
    snapshot: TypedDataSnapshot<Base, Path>;
}
