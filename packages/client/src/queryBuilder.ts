import type {QueryConstraint, QueryConstraintType} from '@firebase/database';
import {query} from '@firebase/database';
import {TypeOfPathField, ValidPath} from 'better-firebase-rtdb-types-common';

import {TypedQuery} from './typedRtdbClientTypes';

interface TypedQueryConstraint<ConstraintType extends QueryConstraintType, ValueType = unknown, ChildPath extends string | never = never> extends QueryConstraint {
    __valueType?: ValueType;
    __childPathType?: ChildPath;
    readonly type: ConstraintType;
}

type PrimitiveType<S> = S extends string | number | boolean | null ? S : never

declare module 'firebase/database' {
    export function startAt<S>(value: PrimitiveType<S | null>, key?: string): TypedQueryConstraint<'startAt', S>;
    export function startAfter<S>(value: PrimitiveType<S | null>, key?: string): TypedQueryConstraint<'startAfter', S>;
    export function equalTo<S>(value: PrimitiveType<S | null>, key?: string): TypedQueryConstraint<'equalTo', S>;
    export function endAt<S>(value: PrimitiveType<S | null>, key?: string): TypedQueryConstraint<'endAt', S>;
    export function endBefore<S>(value: PrimitiveType<S | null>, key?: string): TypedQueryConstraint<'endBefore', S>;

    export function orderByKey(): TypedQueryConstraint<'orderByKey'>;
    export function orderByValue(): TypedQueryConstraint<'orderByValue'>;
    export function orderByPriority(): TypedQueryConstraint<'orderByPriority'>;
    export function orderByChild<ChildPath extends string>(path: ChildPath): TypedQueryConstraint<'orderByChild', unknown, ChildPath>;

    export function limitToFirst(): TypedQueryConstraint<'limitToFirst'>;
    export function limitToLast(): TypedQueryConstraint<'limitToLast'>;
}

class QueryBuilder<Base, Path extends string, S = unknown> {
    readonly query: TypedQuery<Base, Path>;
    constraints: QueryConstraint[] = [];

    constructor(query: TypedQuery<Base, Path>) {
        this.query = query;
    }

    with<T extends QueryConstraintType, ChildPath extends ValidPath<TypeOfPathField<Base, `${Path}/${string}`>> | never>(constraint: TypedQueryConstraint<T, S, ChildPath>) {
        this.constraints.push(constraint);
        return this as unknown as
            T extends 'orderByKey' ? QueryBuilder<Base, Path, string>
                : T extends 'orderByValue' ? QueryBuilder<Base, Path, TypeOfPathField<Base, Path>>
                    : T extends 'orderByPriority' ? QueryBuilder<Base, Path, string | number | null>
                        : T extends 'orderByChild' ? TypeOfPathField<Base, `${Path}/${string}/${ChildPath}`> extends void
                                ? never
                                : QueryBuilder<Base, Path, TypeOfPathField<Base, `${Path}/${string}/${ChildPath}`>>
                            : QueryBuilder<Base, Path, S>;
    }

    toQuery() {
        return query(this.query, ...this.constraints);
    }
}

/**
 * Builds a query to the Realtime Database through chained calls to `with`, concluding with a call to `toQuery`.
 */
export function queryBuilder<Base, Path extends string>(query: TypedQuery<Base, Path>) {
    return new QueryBuilder(query);
}
