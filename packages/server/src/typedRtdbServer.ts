import type {TransactionResult} from '@firebase/database-types';
import type {ChildOfDynamicStringKey, ParentPath, TypeOfPathField} from '@firebase-rtdb-types/common';
import type {database} from 'firebase-admin';

export interface TypedDataSnapshot<Base, Path extends string, Exists extends boolean = boolean> extends database.DataSnapshot {
    /** This field doesn't exist, but can be of use to users to inspect types in their IDEs. */
    readonly __type?: TypeOfPathField<Base, Path>;
    child<ChildPath extends string>(path: ChildPath): TypedDataSnapshot<Base, `${Path}/${ChildPath}`>;
    forEach(action: (a: TypedDataSnapshot<Base, `${Path}/*`, true>) => boolean | void): boolean;
    ref: TypedReference<Base, Path>;
    exists(this: TypedDataSnapshot<Base, Path, Exists>): this is TypedDataSnapshot<Base, Path, true>;
    val(): Exists extends true ? TypeOfPathField<Base, Path> : Exists extends false ? null : TypeOfPathField<Base, Path> | null;

    key: Exists extends true ? string : Exists extends false ? null : string | null;
}

export type TypedThenableReference<Base, Path extends string, S = never> = TypedReference<Base, Path, S> &
    {key: string} &
    Pick<Promise<TypedReference<Base, Path, S>>, 'then' | 'catch'>;

type PrimitiveType<S> = S extends string | number | boolean | null ? S : never

type EventTypeValue = 'value';
type ValueCallback<Base, Path extends string> =
    (snapshot: TypedDataSnapshot<Base, Path>) => unknown;

type EventTypeChildRemoved = 'child_removed';
type ChildRemovedCallback<Base, Path extends string> =
    (childSnapshot: TypedDataSnapshot<Base, `${Path}/*`, true>) => unknown;

type EventTypeChildOther = 'child_added' | 'child_changed' | 'child_moved';
type ChildEventCallbackWithPrevKey<Base, Path extends string> =
    (childSnapshot: TypedDataSnapshot<Base, `${Path}/*`, true>, previousChildKey: string | null) => unknown;

/**
 * As well as the base type `Base` and the current path `Path`, a TypedQuery can have an "active search type" S, which
 * is determined by the orderBy methods. If you orderByChild("foo") for example, then the first parameter of a
 * subsequent endAt/endBefore etc. has the type of the "foo" field of a child of the current reference.
 */
export interface TypedQuery<Base, Path extends string, S = never> extends database.Query {
    /** This field doesn't exist, but can be of use to users to inspect types in their IDEs. */
    readonly __type?: TypeOfPathField<Base, Path>;
    ref: TypedReference<Base, Path, S>;

    get(): Promise<TypedDataSnapshot<Base, Path>>;

    on<Callback extends ValueCallback<Base, Path>>(
        eventType: EventTypeValue,
        callback: Callback,
        cancelCallbackOrContext?: ((a: Error) => unknown) | object | null,
        context?: object | null
    ): Callback;
    on<Callback extends ChildRemovedCallback<Base, Path>>(
        eventType: EventTypeChildRemoved,
        callback: Callback,
        cancelCallbackOrContext?: ((a: Error) => unknown) | object | null,
        context?: object | null
    ): Callback;
    on<Callback extends ChildEventCallbackWithPrevKey<Base, Path>>(
        eventType: EventTypeChildOther,
        callback: Callback,
        cancelCallbackOrContext?: ((a: Error) => unknown) | object | null,
        context?: object | null
    ): Callback;

    off(
        eventType?: EventTypeValue | EventTypeChildRemoved | EventTypeChildOther,
        callback?: (childSnapshot: TypedDataSnapshot<Base, Path | `${Path}/*`>, childKey?: string | null) => unknown,
        context?: object | null
    ): void;

    once(
        eventType: EventTypeValue,
        successCallback?: ValueCallback<Base, Path>,
        failureCallbackOrContext?: ((a: Error) => void) | object | null,
        context?: object | null
    ): Promise<TypedDataSnapshot<Base, Path>>;
    once(
        eventType: EventTypeChildRemoved,
        successCallback?: ChildRemovedCallback<Base, Path>,
        failureCallbackOrContext?: ((a: Error) => void) | object | null,
        context?: object | null
    ): Promise<TypedDataSnapshot<Base, `${Path}/*`>>;
    once(
        eventType: EventTypeChildOther,
        successCallback?: ChildEventCallbackWithPrevKey<Base, Path>,
        failureCallbackOrContext?: ((a: Error) => void) | object | null,
        context?: object | null
    ): Promise<TypedDataSnapshot<Base, `${Path}/*`>>;

    orderByChild<ChildPath extends string>(path: ChildPath): TypedQuery<Base, Path, TypeOfPathField<Base, `${Path}/*/${ChildPath}`>>;
    orderByKey(): TypedQuery<Base, Path, string>;
    orderByPriority(): TypedQuery<Base, Path, string | number | null>;
    orderByValue(): TypedQuery<Base, Path, TypeOfPathField<Base, Path>>;

    endBefore(value: PrimitiveType<S | null>, key?: string): TypedQuery<Base, Path, S>;
    endAt(value: PrimitiveType<S | null>, key?: string): TypedQuery<Base, Path, S>;
    equalTo(value: PrimitiveType<S | null>, key?: string): TypedQuery<Base, Path, S>;
    startAt(value: PrimitiveType<S | null>, key?: string): TypedQuery<Base, Path, S>;
    startAfter(value: PrimitiveType<S | null>, key?: string): TypedQuery<Base, Path, S>;

    limitToFirst(limit: number): TypedQuery<Base, Path, S>;
    limitToLast(limit: number): TypedQuery<Base, Path, S>;
}

interface TypedTransactionResult<Base, Path extends string> extends TransactionResult {
    snapshot: TypedDataSnapshot<Base, Path>;
}

export interface TypedReference<Base, Path extends string, S = never> extends Omit<database.Reference, keyof database.Query>, TypedQuery<Base, Path, S> {
    root: TypedReference<Base, ''>;
    parent: TypedReference<Base, ParentPath<Path>>;
    child<ChildPath extends string>(path: ChildPath): TypedReference<Base, `${Path}/${ChildPath}`>;
    push(
        value?: ChildOfDynamicStringKey<TypeOfPathField<Base, Path>>,
        onComplete?: (a: Error | null) => void
    ): TypedThenableReference<Base, Path, S>;
    set(value: TypeOfPathField<Base, Path>, onComplete?: (a: Error | null) => void): Promise<void>;
    setWithPriority(
        newVal: TypeOfPathField<Base, Path>,
        newPriority: string | number | null,
        onComplete?: (a: Error | null) => void
    ): Promise<void>;
    // The base definition of database.Reference.update has values being of type `Object`, so we need to use an
    // intersection type for the `values` parameter below to declare it as both an object and a Partial<T>.
    update(
        values: TypeOfPathField<Base, Path> extends object ? (object & Partial<TypeOfPathField<Base, Path>>) : never,
        onComplete?: (a: Error | null) => void
    ): Promise<void>;
    transaction(
        transactionUpdate: (currentData: TypeOfPathField<Base, Path> | null) => TypeOfPathField<Base, Path> | null | undefined,
        onComplete?: (error: Error | null, committed: boolean, snapshot: TypedDataSnapshot<Base, Path> | null) => unknown,
        applyLocally?: boolean // Optional argument
    ): Promise<TypedTransactionResult<Base, Path>>;
}

export interface TypedDatabase<Base> extends database.Database {
    ref<ChildPath extends string>(path: ChildPath): TypedReference<Base, ChildPath>;
}
