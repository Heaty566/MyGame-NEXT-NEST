import * as React from 'react';
import { useSelector } from 'react-redux';

import userThunk from '../../store/auth/userThunk';
import { RootState, store } from '../../store';
import { IAuthState } from '../../store/auth/interface';

export interface AuthLoginProps {
    Component: Function;
    props: any;
}

const AutoLogin: React.FunctionComponent<AuthLoginProps> = ({ Component, props }) => {
    const authState = useSelector<RootState, IAuthState>((state) => state.auth);

    React.useEffect(() => {
        if (authState.isLogin) store.dispatch(userThunk.getCurrentUser());
    }, [authState.isLogin]);
    return <Component {...props} />;
};

export default AutoLogin;