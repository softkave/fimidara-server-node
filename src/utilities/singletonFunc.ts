export type SingletonFnInit<Data, Arguments extends any[]> = (
    ...args: Arguments
) => Data;

export default function singletonFunc<Data, Arguments extends any[]>(
    init: SingletonFnInit<Data, Arguments>
): SingletonFnInit<Data, Arguments> {
    let data: Data | null = null;

    return (...args: Arguments) => {
        if (!data) {
            data = init(...args);
        }

        return data;
    };
}
