import * as React from 'react';
import { THandleChangeLanguage } from '../navbarLang';
import MobileNavBtn from './mobileNavBtn';
import MobileNavSideMenu from './mobileSideMenu';

export interface NavbarMobileProps {
        handleChangeActive(): void;
        handleChangeActiveLang(): void;
        handleChangeLanguage: THandleChangeLanguage;
        isActive: boolean;
        isActiveLang: boolean;
}

const NavbarMobile: React.FunctionComponent<NavbarMobileProps> = ({
        handleChangeActive,
        handleChangeActiveLang,
        isActiveLang,
        handleChangeLanguage,
        isActive = false,
}) => (
        <>
                <MobileNavBtn handleChangeActive={handleChangeActive} />
                <MobileNavSideMenu
                        handleChangeActiveLang={handleChangeActiveLang}
                        isActive={isActive}
                        isActiveLang={isActiveLang}
                        handleChangeLanguage={handleChangeLanguage}
                />
                {isActive && (
                        <div
                                className="fixed top-0 left-0 w-full h-screen z-30"
                                onClick={() => handleChangeActive()}
                                aria-hidden
                        />
                )}
        </>
);

export default NavbarMobile;