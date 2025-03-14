import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  UserPlusIcon
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications , Projects , Users , Documentation} from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import { Dashboard } from "./layouts";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    title: "Overview",
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
    
      // {
      //   icon: <InformationCircleIcon {...icon} />,
      //   name: "notifications",
      //   path: "/notifications",
      //   element: <Notifications />,
      // },
    ],
  },
  {
    title: "Core",
    layout: "dashboard",
    pages: [
      {
        icon: <ChartPieIcon {...icon} />,
        name: "Projects",
        path: "/projects",
        element: <Projects />,
      },
      // {
      //   icon: <UserCircleIcon {...icon} />,
      //   name: "profile",
      //   path: "/profile",
      //   element: <Profile />,
      // },
     
    ],
  },
  {
    title: "Account",
    layout: "dashboard",
    pages: [
    
      {
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Settings",
        path: "/tables",
        element: <Tables />,
      },
      {
        icon: <UserPlusIcon {...icon} />,
        name: "User",
        path: "/user",
        element: <Users />,
      },
    ],
  },
  {
    title: "Extra",
    layout: "dashboard",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "documentation",
        path: "/documentation",
        element: <Documentation />,
      },
    ],
  },
  {
    layout: "auth",
    pages: [
      {
        layout: "auth",
        path: "/sign-in",
        element: <SignIn />,
      },
    ],
  },
];

export default routes;
