import * as React from "react";
import Link from "next/link";

const userIcon = {
        login: (
                <svg className="mr-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M10 9C10.7956 9 11.5587 8.68393 12.1213 8.12132C12.6839 7.55871 13 6.79565 13 6C13 5.20435 12.6839 4.44129 12.1213 3.87868C11.5587 3.31607 10.7956 3 10 3C9.20435 3 8.44129 3.31607 7.87868 3.87868C7.31607 4.44129 7 5.20435 7 6C7 6.79565 7.31607 7.55871 7.87868 8.12132C8.44129 8.68393 9.20435 9 10 9V9ZM3 18C3 17.0807 3.18106 16.1705 3.53284 15.3212C3.88463 14.4719 4.40024 13.7003 5.05025 13.0503C5.70026 12.4002 6.47194 11.8846 7.32122 11.5328C8.1705 11.1811 9.08075 11 10 11C10.9193 11 11.8295 11.1811 12.6788 11.5328C13.5281 11.8846 14.2997 12.4002 14.9497 13.0503C15.5998 13.7003 16.1154 14.4719 16.4672 15.3212C16.8189 16.1705 17 17.0807 17 18H3Z"
                                fill="#3F3F46"
                        />
                </svg>
        ),
        register: (
                <svg className="mr-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                                d="M8 9C8.79565 9 9.55871 8.68393 10.1213 8.12132C10.6839 7.55871 11 6.79565 11 6C11 5.20435 10.6839 4.44129 10.1213 3.87868C9.55871 3.31607 8.79565 3 8 3C7.20435 3 6.44129 3.31607 5.87868 3.87868C5.31607 4.44129 5 5.20435 5 6C5 6.79565 5.31607 7.55871 5.87868 8.12132C6.44129 8.68393 7.20435 9 8 9ZM8 11C9.5913 11 11.1174 11.6321 12.2426 12.7574C13.3679 13.8826 14 15.4087 14 17H2C2 15.4087 2.63214 13.8826 3.75736 12.7574C4.88258 11.6321 6.4087 11 8 11ZM16 7C16 6.73478 15.8946 6.48043 15.7071 6.29289C15.5196 6.10536 15.2652 6 15 6C14.7348 6 14.4804 6.10536 14.2929 6.29289C14.1054 6.48043 14 6.73478 14 7V8H13C12.7348 8 12.4804 8.10536 12.2929 8.29289C12.1054 8.48043 12 8.73478 12 9C12 9.26522 12.1054 9.51957 12.2929 9.70711C12.4804 9.89464 12.7348 10 13 10H14V11C14 11.2652 14.1054 11.5196 14.2929 11.7071C14.4804 11.8946 14.7348 12 15 12C15.2652 12 15.5196 11.8946 15.7071 11.7071C15.8946 11.5196 16 11.2652 16 11V10H17C17.2652 10 17.5196 9.89464 17.7071 9.70711C17.8946 9.51957 18 9.26522 18 9C18 8.73478 17.8946 8.48043 17.7071 8.29289C17.5196 8.10536 17.2652 8 17 8H16V7Z"
                                fill="#3F3F46"
                        />
                </svg>
        ),
};

type UserType = keyof typeof userIcon;

export interface UserItemProps {
        link: string;
        label: string;
        icon: UserType;
}

const UserItem: React.FunctionComponent<UserItemProps> = ({ label, link = "/", icon }) => {
        return (
                <Link href="/user/login">
                        <a className="flex items-center hover:text-blue-500 duration-300" href={link}>
                                {userIcon[icon]}
                                <p className="text-base font-bold ">{label}</p>
                        </a>
                </Link>
        );
};

export default UserItem;