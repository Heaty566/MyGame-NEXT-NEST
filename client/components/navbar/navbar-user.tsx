import * as React from 'react';
import Link from 'next/link';

import router from '../../common/constants/router';
import { AuthState } from '../../common/interface/user.interface';
import { useClickOutSide } from '../../common/hooks/useClickOutside';

import ArrowDropDownMenu from '../menu/menu-arrow-dropdown';
import NavbarLanguage from './navbar-language';
import UserDropDown from './user-drop-down';

export interface NavbarUserProps {
    handleChangeLanguage: (data: any) => void;
    authState: AuthState;
    handleLogoutUser: () => void;
}

const NavbarUser: React.FunctionComponent<NavbarUserProps> = ({ handleChangeLanguage, authState, handleLogoutUser }) => {
    const [isOpenUser, setOpenUser] = React.useState(false);
    const [isOpenLanguage, setOpenLanguage] = React.useState(false);
    const userRef = useClickOutSide<HTMLDivElement>(() => setOpenUser(false));

    return (
        <div className="items-center self-start hidden space-x-4 text-cloud md:flex ">
            {authState.isLogin && (
                <ArrowDropDownMenu
                    Component={<UserDropDown handleLogoutUser={handleLogoutUser} authState={authState} />}
                    isOpen={isOpenUser}
                    setOpen={() => setOpenUser(!isOpenUser)}
                    dropMenuPosition="right-0"
                    reference={userRef}
                >
                    <div className="flex items-center justify-center mr-1 space-x-2 capitalize duration-300 hover:text-cloud-50">
                        <img src={authState.avatarUrl} alt={authState.name} className="object-cover w-8 h-8" />
                        <h1>{authState.name}</h1>
                    </div>
                </ArrowDropDownMenu>
            )}

            {!authState.isLogin && (
                <>
                    <div>
                        <Link href={router.login.link}>
                            <a href={router.login.link} className="duration-300 hover:text-cloud-50">
                                Login
                            </a>
                        </Link>
                    </div>
                </>
            )}

            {!authState.isLogin && (
                <>
                    <div className="h-3 w-0.5 bg-cloud" />
                    <ArrowDropDownMenu
                        Component={<NavbarLanguage handleOnChangeLanguage={handleChangeLanguage} />}
                        isOpen={isOpenLanguage}
                        setOpen={() => setOpenLanguage(!isOpenLanguage)}
                        dropMenuPosition="right-0"
                    >
                        <span className="mr-1 duration-300 hover:text-cloud-50">Language</span>
                    </ArrowDropDownMenu>
                </>
            )}
        </div>
    );
};
export default NavbarUser;
