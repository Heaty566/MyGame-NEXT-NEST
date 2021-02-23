/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Cookies from "universal-cookie";
import { Provider } from "react-redux";
import "../i18n";
import "../styles/tailwind.css";

//* Import
import { store } from "../store";
import { authActions } from "../store/auth";
import { apiActions } from "../store/api";
import Navbar from "../components/navbar";
export interface AppProps {
        Component: React.FunctionComponent;
        pageProps: any;
}

const App: React.FunctionComponent<AppProps> = ({ Component, pageProps }) => {
        const { i18n } = useTranslation();
        const cookies = new Cookies();
        const reToken = cookies.get("re-token");

        useEffect(() => {
                const lang = cookies.get("lang");
                i18n.changeLanguage(lang);
        }, []);

        useEffect(() => {
                store.dispatch(apiActions.resetState());
        }, [Component]);

        useEffect(() => {}, [reToken]);

        return (
                <Provider store={store}>
                        <div className="h-screen flex">
                                <Navbar />
                                <Component {...pageProps} />
                        </div>
                </Provider>
        );
};

export default App;