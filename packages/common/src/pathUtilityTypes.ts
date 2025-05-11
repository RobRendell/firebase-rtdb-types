/**
 * If Key is a key of T, return T[Key], else void (handles the special case where Javascript implicitly converts numbers
 * to strings, see first paragraph of:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors#property_names)
 */
type TypeOfStringOrNumberField<T, Key> = Key extends keyof T
    ? Required<T>[Key]
    : Key extends `${number}`
        ? T extends {[key: number]: unknown}
            ? Required<T>[number]
            : void
        : void;

/**
 * Strips off any leading slash, then drills down into a type, treating Key as a slash separated list of keys or
 * wildcard characters (which represent unbound string or number keys in the type) and resolving to the resulting type.
 * If the given path is invalid, resolves to void.
 *
 * Example: `TypeOfPathField<{a: {b: number}}, '/a/b'>` resolves to the type `number`
 *
 * Note: Trailing slashes should be avoided, as they will index the final type with an extra '' key, which will probably
 * be invalid: `TypeOfPathField<{a: {b: number}}, '/a/b/'>` resolves to void
 */
export type TypeOfPathField<T, Path extends string> = T extends object
    ? Path extends `/${infer SubPath}`
        ? TypeOfPathField<T, SubPath>
        : Path extends `${infer KeyOfT}/${infer SubPath}`
            ? TypeOfPathField<TypeOfStringOrNumberField<T, KeyOfT>, SubPath>
            : TypeOfStringOrNumberField<T, Path>
    : void;

/**
 * In some cases, it is useful to specify that we want the child of some Object, where that object only has "dynamic"
 * keys. i.e. [key: string]
 */
export type ChildOfDynamicStringKey<T> = T extends {[key: string]: string}
    ? string extends keyof T
        ? T[string]
        : void
    : (number | string) extends keyof T
        ? T[keyof T]
        : void;

/**
 * Utility type to get all but the final level of a slash-delimited string.
 */
export type ParentPath<Path extends string> = Path extends `${infer Parent}/${infer SubPath}`
    ? SubPath extends ''
        ? ''
        : (SubPath extends `${string}/${string}` ? `${Parent}/${ParentPath<SubPath>}` : Parent)
    : '';

type StringOrNumberOrKey<K> = string extends K ? `${string}` : number extends K ? `${number}` : K;

/**
 * Utility type to enumerate the keys of a type. Keys that result in a further object are augmented with `/${string} to
 * allow further path elements, but are not recursively enumerated for efficiency reasons.
 */
export type ValidPath<T> =
    T extends object
        ? {
            [K in keyof T & (string | number)]: `${StringOrNumberOrKey<K>}` | (
            T[K] extends object
                ? `${StringOrNumberOrKey<K>}/${string}`
                : never
            );
        }[keyof T & (string | number)]
        : never;
