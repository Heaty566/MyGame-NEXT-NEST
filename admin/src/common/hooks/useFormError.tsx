import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { IApiState } from '../../store/api/interface';

export function useFormError<T>(defaultValues: T) {
    const [errors, setErrors] = React.useState<T>(defaultValues);
    const apiState = useSelector<RootState, IApiState>((state) => state.api);

    React.useEffect(() => {
        const { isError, errorDetails } = apiState;

        if (isError) setErrors({ ...defaultValues, ...errorDetails });
        else setErrors(defaultValues);
    }, [apiState, defaultValues]);

    return errors;
}

export default useFormError;
