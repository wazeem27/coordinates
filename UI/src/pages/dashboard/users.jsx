import React, { useReducer, useEffect } from "react";
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Dialog,
  Chip,
  CardFooter,
  Tooltip,
  Progress,
  Input,
  Checkbox,
  Select, Option,
  Button,
  Tabs,
  TabsHeader,
  Tab,
  IconButton,
  Popover,
  PopoverHandler,
  PopoverContent,
  Spinner
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { Notifications } from "@/pages/dashboard";
const TABLE_HEAD = ["Member", "Email", "Employed", "Status", ""];
const initialState = [
  {
    userlist: [],
    fuserlist: [],
    first_name: "",
    last_name: "",
    username: '',
    password: '',
    cpassword: '',
    email: '',
    utype: "True",
    emptype: "False",
    loader: false,
    notification: {}
  },

];

function reducer(state, action) {
  switch (action.type) {
    case 'userlist': {
      return {
        ...state,
        userlist: action.value,
      };
    }
    case 'fuserlist': {
      return {
        ...state,
        fuserlist: action.value,
      };
    }
    case 'username': {
      return {
        ...state,
        username: action.value,
      };
    }
    case 'first_name': {
      return {
        ...state,
        first_name: action.value,
      };
    }
    case 'last_name': {
      return {
        ...state,
        last_name: action.value,
      };
    }
    case 'password': {
      return {
        ...state,
        password: action.value,
      };
    }
    case 'cpassword': {
      return {
        ...state,
        cpassword: action.value,
      };
    }
    case 'email': {
      return {
        ...state,
        email: action.value,
      };
    }
    case 'utype': {
      return {
        ...state,
        utype: action.value,
      };
    }
    case 'emptype': {
      return {
        ...state,
        emptype: action.value,
      };
    }
    case 'loader': {
      return {
        ...state,
        loader: action.value
      };
    }
    case 'notification': {
      return {
        ...state,
        notification: action.value
      };
    }

  }
}

export function Users() {
  const [open, setOpen] = React.useState(false);
  const [eidtOpen, seteidtOpen] = React.useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);


  const handleOpen = (action , id) => {
    alert(id)
    setOpen((cur) => !cur);
  }

  const handleEditOpen = (id) => {
    seteidtOpen((cur) => !cur);
    let f = state.userlist.filter(users => users.id == id);
    dispatch({ type: 'fuserlist', value: f })
  }


  const deactivateUser = (id) => {
    dispatch({ type: 'loader', value: true });
    axios.delete(`https://bellatrix1.pythonanywhere.com/auth/users/${id}/deactivate/`,
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success 
        listUsers();
        dispatch({ type: 'notification', value: { message: "User Deactivated Successfully", colour: "green" } });
      })
      .catch(function (error) {
        // handle error
        dispatch({ type: 'notification', value: { message: error, colour: "red" } });
      })
      .finally(function () {
        // always executed
        dispatch({ type: 'loader', value: false });
        setTimeout(() =>{closealerts();},1500)
      });
  }

  const closealerts = () => {
    dispatch({ type: 'notification', value: "" })
  }

  const activateUser = (id) => {
    dispatch({ type: 'loader', value: true });
    axios.put(`https://bellatrix1.pythonanywhere.com/auth/users/${id}/activate/`, "",
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        },
      }
    )
      .then(function (response) {
        // handle success
        listUsers();
        dispatch({ type: 'notification', value: { message: "User Activated Successfully", colour: "green" } });
      })
      .catch(function (error) {
        // handle error
        dispatch({ type: 'notification', value: { message: error, colour: "red" } });
      })
      .finally(function () {
        // always executed
        dispatch({ type: 'loader', value: false });
        setTimeout(() =>{closealerts();},1500)
      });
  }

  const handleUtype = (e) => {
    dispatch({ type: 'utype', value: e });
  }

  const handleEmtype = (e) => {
    dispatch({ type: 'emptype', value: e });
  }
  const createUser = (id) => {

    dispatch({ type: 'loader', value: true });
    axios.post(`https://bellatrix1.pythonanywhere.com/auth/create-user/`, {
      username: state.username,
      first_name: state.first_name,
      last_name: state.last_name,
      password: state.password,
      password_confirm: state.cpassword,
      email: state.email,
      is_admin: state.utype,
      is_employee: state.emptype
    },
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        },

      }
    )
      .then(function (response) {
        // handle success
 
        listUsers();
        setOpen((cur) => !cur);
        dispatch({ type: 'notification', value: { message: "User Created Successfully", colour: "green" } });
      })
      .catch(function (error) {
        // handle error
        dispatch({ type: 'notification', value: { message: "User Created Successfully", colour: "red" } });
      })
      .finally(function () {
        // always executed
        dispatch({ type: 'loader', value: false });
        setTimeout(() =>{closealerts();},1500);
      });
  }

  const listUsers = () => {
    dispatch({ type: 'loader', value: true });
    axios.get('https://bellatrix1.pythonanywhere.com/auth/users/',
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success
        console.log(response);
        dispatch({ type: 'userlist', value: response.data.data });
        dispatch({ type: 'loader', value: false });
      })
      .catch(function (error) {
        // handle error
        dispatch({ type: 'loader', value: false });
      })
      .finally(function () {
        // always executed
      });
  }
  useEffect(() => {
    listUsers()
  }, [])

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
       {state.notification ? <Notifications alertType={{ colour: state.notification.colour, message: state.notification.message }} closealert={e => closealerts()} /> : null}
      <div className="absolute top-50" style={{ top: "50%", left: '50%', zIndex: "99999" }}>
        {state.loader ? <Spinner className="h-16 w-16 text-gray-900/50" /> : null}
      </div>
      <Dialog
        size="xl"
        open={open}
        handler={handleOpen}
        className="bg-transparent shadow-none"
      >
        <Card className="mx-auto w-full max-w-[50rem]">
          <CardBody className="flex flex-col gap-2 p-4">
            {/* <Typography variant="h4" color="blue-gray">
              Create User
            </Typography> */}
            <Typography className="-mb-2" variant="h6">
              User Name
            </Typography>
            <Input label="User Name" value={state.username} size="md" onChange={(e) => dispatch({ type: 'username', value: e.target.value })} />

            <Typography className="-mb-2" variant="h6">
              First Name
            </Typography>
            <Input label="First Name" size="md" onChange={(e) => dispatch({ type: 'first_name', value: e.target.value })} />

            <Typography className="-mb-2" variant="h6">
              Last Name
            </Typography>
            <Input label="Last Name" size="md" onChange={(e) => dispatch({ type: 'last_name', value: e.target.value })} />

            <Typography className="-mb-2" variant="h6">
              Password
            </Typography>
            <Input label="Password" size="md" type="password" onChange={(e) => dispatch({ type: 'password', value: e.target.value })} />
            <Typography className="-mb-2" variant="h6">
              Confirm Password
            </Typography>
            <Input label="Confirm Password" size="md" type="password" onChange={(e) => dispatch({ type: 'cpassword', value: e.target.value })} />
            <Typography className="-mb-2" variant="h6">
              Email
            </Typography>
            <Input label="Email" size="md" onChange={(e) => dispatch({ type: 'email', value: e.target.value })} />
            <Typography className="-mb-2" variant="h6">
              Admin
            </Typography>
            <Select size="md" label="Select Type" value={state.utype} onChange={handleUtype}>
              <Option value="True">Yes</Option>
              <Option value="False">No</Option>
            </Select>
            <Typography className="-mb-2" variant="h6">
              Employee
            </Typography>
            <Select size="md" label="Select Type" value={state.emptype} onChange={handleEmtype}>
              <Option value="True">Yes</Option>
              <Option value="False">No</Option>
            </Select>
          </CardBody>
          <CardFooter className="pt-0">
            <Button variant="gradient" onClick={e => createUser()} fullWidth>
              Create User
            </Button>
          </CardFooter>
        </Card>
      </Dialog>

      {/* <Dialog
        size="xl"
        open={eidtOpen}
        handler={handleEditOpen}
        className="bg-transparent shadow-none"
      >
        <Card className="mx-auto w-full max-w-[50rem]">
          <CardBody className="flex flex-col gap-2.5">
            <Typography variant="h4" color="blue-gray">
              Edit User
            </Typography>
            <Typography className="-mb-2" variant="h6">
              User Name
            </Typography>
            <Input label="Username" size="lg" />
            <Typography className="-mb-2" variant="h6">
              FIrst Name
            </Typography>
            <Input label="First Name" size="lg" />
            <Typography className="-mb-2" variant="h6">
              Last Name
            </Typography>
            <Input label="Last Name" size="lg" />
            <Typography className="-mb-2" variant="h6">
              Email
            </Typography>
            <Input label="Email" size="lg" />
            <Typography className="-mb-2" variant="h6">
              Action
            </Typography>
            <Select label="Select Type">
              <Option value="activate">Activate</Option>
              <Option value="deactivate">Deactivate</Option>
            </Select>

          </CardBody>
          <CardFooter className="pt-0">
            <Button variant="gradient" onClick={handleOpen} fullWidth>
              Update User
            </Button>
          </CardFooter>
        </Card>
      </Dialog> */}

      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-8 flex items-center justify-between gap-8">
            <div>
              <Typography variant="h5" color="blue-gray">
                User list
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                See information about all Users
              </Typography>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {/* <Button variant="outlined" size="sm">
              view all
            </Button> */}
              <Button onClick={e => handleOpen("create")} className="flex items-center gap-3" size="sm">
                <UserPlusIcon strokeWidth={2} className="h-4 w-4" /> Add member
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* <Tabs value="all" className="w-full md:w-max">
            <TabsHeader>
              {TABS.map(({ label, value }) => (
                <Tab key={value} value={value}>
                  &nbsp;&nbsp;{label}&nbsp;&nbsp;
                </Tab>
              ))}
            </TabsHeader>
          </Tabs> */}
            <div className="w-full md:w-72">
              <Input
                label="Search"
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-scroll px-0">
          <table className="mt-4 w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head, index) => (
                  <th
                    key={head}
                    className="cursor-pointer border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 transition-colors hover:bg-blue-gray-50"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="flex items-center justify-between gap-2 font-normal leading-none opacity-70"
                    >
                      {head}{" "}
                      {index !== TABLE_HEAD.length - 1 && (
                        <ChevronUpDownIcon strokeWidth={2} className="h-4 w-4" />
                      )}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* {console.log(state.userlist)} */}
              {state.userlist && state.userlist.map(
                ({ username, email, role, flag, id }, index) => {
                  const isLast = index === state.userlist.length - 1;
                  const classes = isLast
                    ? "p-4"
                    : "p-4 border-b border-blue-gray-50";

                  return (
                    <tr key={name}>
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          {/* <Avatar src={img} alt={name} size="sm" /> */}
                          <div className="flex flex-col">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal"
                            >
                              {username}
                            </Typography>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal opacity-70"
                            >
                              {email}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          {/* <Avatar src={img} alt={name} size="sm" /> */}
                          <div className="flex flex-col">

                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal opacity-70"
                            >
                              {email}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="flex flex-col">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            {role}
                          </Typography>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal opacity-70"
                          >
                            {/* {flag} */}
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="w-max">
                          {/* <Chip
                            variant="ghost"
                            size="sm"
                            value={"online" ? "online" : "offline"}
                            color={"online" ? "green" : "blue-gray"}
                          /> */}
                          {flag}
                        </div>
                      </td>
                      {/* <td className={classes}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {"date"}
                        </Typography>
                      </td> */}
                      <td className={classes}>
                        <Popover>
                          <PopoverHandler>
                            <IconButton variant="text">
                              <PencilIcon className="h-4 w-4"
                              />
                            </IconButton>
                          </PopoverHandler>
                          <PopoverContent>
                            <div className="cursor-pointer w-32">
                              <p className="p-1 mb-3" onClick={ e => handleOpen("update" , id)}  style={{ display: 'block', width: '100%', float: "left" }}><span style={{ "float": "left", "padding-right": "10px" }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg></span>
                                <span style={{ "float": "left", "padding-right": "10px" }} >Edit</span>
                              </p>
                              {flag == "deactivated" ? <p className="p-1" onClick={e => activateUser(id)}>
                                <span style={{ "float": "left", "padding-right": "10px" }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg></span>
                                <span style={{ "float": "left", "padding-right": "10px" }}>Activate</span>
                              </p> :
                                <p className="p-1" onClick={e => deactivateUser(id)}>
                                  <span style={{ "float": "left", "padding-right": "10px" }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                  </svg></span>
                                  <span style={{ "float": "left", "padding-right": "10px" }}>Deactivate</span>
                                </p>}
                            </div>
                          </PopoverContent>
                        </Popover>

                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </CardBody>
        <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Page 1 of 10
          </Typography>
          <div className="flex gap-2">
            <Button variant="outlined" size="sm">
              Previous
            </Button>
            <Button variant="outlined" size="sm">
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>



    </div >
  );
}

export default Users;
