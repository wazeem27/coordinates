import React, { useReducer, useEffect, useContext, useState } from "react";
import axios from 'axios';
import { LoaderContext } from '@/context/loaderContext';
import { ToasterContext } from '@/context/ToasterContext';
import { UsersDetail } from './userDetail'
import Paginate from '@/widgets/layout/pagination';
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
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { PencilIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { authorsTableData } from "@/data";
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
    notification: {},
    filter: "",
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
    case 'filter': {
      return {
        ...state,
        filter: action.value
      };
    }

  }
}

export function Users() {
  const [open, setOpen] = React.useState(false);
  const [userdetail, showuserdetail] = React.useState(false);
  const [eidtOpen, seteidtOpen] = React.useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { setloader } = useContext(LoaderContext);
  const { setalertType, showtoast } = useContext(ToasterContext);


  const [usersPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUsers, setcurrentUsers] = useState(state.fuserlist);
  const indexOfLastPost = currentPage * usersPerPage;
  const indexOfFirstPost = indexOfLastPost - usersPerPage;

  const handleOpen = (action, id) => {
    setOpen((cur) => !cur);
  }

  useEffect(() => {
    if (state.userlist != undefined) {
      let currentUserlst = state.userlist && state.userlist.slice(indexOfFirstPost, indexOfLastPost);
      setcurrentUsers(currentUserlst);
    }
  }, [state.userlist])

  const searchFilter = (e) => {
    dispatch({ type: 'filter', value: e.target.value });
  }

  const sortByusernameAsc = () => {
    let sortedProductsAsc;
    sortedProductsAsc = state.fuserlist.sort((a, b) => {
      return a.username - b.username
    })

    console.log(sortedProductsAsc)
  }
  useEffect(() => {
    let data = state.filter != '' ? state.userlist && state.userlist.filter(d => d.username === state.filter) : state.userlist
    dispatch({ type: 'fuserlist', value: data });
    let currentPr = state.fuserlist && state.fuserlist.slice(indexOfFirstPost, indexOfLastPost);
    setcurrentUsers(currentPr);
  }, [state.filter])

  useEffect(() => {
    if (currentPage && state.userlist != undefined) {
      const indexOfLastPost = currentPage * usersPerPage;
      const indexOfFirstPost = indexOfLastPost - usersPerPage;
      let currentUserlst = state.userlist.slice(indexOfFirstPost, indexOfLastPost);
      setcurrentUsers(currentUserlst);
    }
  }, [currentPage]);

  const deactivateUser = (id) => {
    setloader(true);
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
        setalertType({ colour: "green", message: response.data.message });
        showtoast(true);
      })
      .catch(function (error) {
        // handle error
        setalertType({ colour: "red", message: error.response.data.message });
        showtoast(true);
      })
      .finally(function () {
        // always executed
        setloader(false);
        setTimeout(() => { showtoast(false); }, 1500);
      });
  }

  const closealerts = () => {
    dispatch({ type: 'notification', value: "" })
  }

  const activateUser = (id) => {
    setloader(true);
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
        setalertType({ colour: "green", message: response.data.message });
        showtoast(true);
      })
      .catch(function (error) {
        // handle error 
        setalertType({ colour: "green", message: error.response.data.message });
        showtoast(true);
      })
      .finally(function () {
        // always executed
        setloader(false);
        setTimeout(() => { showtoast(false); }, 1500);
      });
  }

  const handleUtype = (e) => {
    dispatch({ type: 'utype', value: e });
  }

  const handleEmtype = (e) => {
    dispatch({ type: 'emptype', value: e });
  }

  const createUser = (id) => {
    setloader(true);
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
        setalertType({ colour: "green", message: response.data.message });
        showtoast(true);
      })
      .catch(function (error) {
        // handle error 
        setalertType({ colour: "red", message: error.response.data.message });
        showtoast(true);
      })
      .finally(function () {
        // always executed
        setloader(false);
        setTimeout(() => { showtoast(false); }, 1500);
      });
  }

  const listUsers = () => {
    setloader(true);
    axios.get('https://bellatrix1.pythonanywhere.com/auth/users/',
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success  
        if (response.data.status == "success") {
          dispatch({ type: 'userlist', value: response.data.data });
        }

        // dispatch({ type: 'fuserlist', value: response.data.data });
      })
      .catch(function (error) {
        // handle error
        setalertType({ colour: "red", message: error.response.data.message });
        showtoast(true);
      })
      .finally(function () {
        // always executed
        setloader(false);
      });
  }
  useEffect(() => {
    listUsers()
  }, []);

  const getUserDetail = (id) => {
    setloader(true);
    axios.get(`https://bellatrix1.pythonanywhere.com/auth/users/${id}/`,
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success
        showuserdetail(response.data.data)
      })
      .catch(function (error) {
        // handle error
        setalertType({ colour: "red", message: error.response.data.message });
        showtoast(true);
      })
      .finally(function () {
        // always executed
        setloader(false);
      });
  }

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      {
        userdetail ? <UsersDetail userdetail={userdetail} showuserdetail={showuserdetail} /> : <>
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
                <Input label="User Name"  size="md" onChange={(e) => dispatch({ type: 'username', value: e.target.value })} />

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
          <div className="flex justify-end" fullWidth>
          <Button variant="gradient" onClick={e => handleOpen()} style={{"width":"155px" , "float":"left" }}>
                  Create New User
                </Button>
          </div>
          <Card style={{minHeight:"400px"}}>
            <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
              <Typography variant="h6" color="white">
                Users
              </Typography>
            </CardHeader>
            <CardBody className="px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["User", "role", "status", "employed", ""].map((el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                      >
                        <Typography
                          variant="small"
                          className="text-[11px] font-bold uppercase text-blue-gray-400"
                        >
                          {el}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentUsers && currentUsers.map(
                    ({ id, username, email, role, flag }, key) => {
                      const className = `py-3 px-5 ${key === authorsTableData.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                        }`;

                      return (
                        <tr key={username}>
                          <td className={className}>
                            <div className="flex items-center gap-4">
                              <Avatar src={"/img/team-2.jpeg"} alt={username} size="sm" variant="rounded" />
                              <div style={{ cursor: "pointer" }}>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-semibold"
                                  onClick={e => getUserDetail(id)}
                                >
                                  {username}
                                </Typography>
                                <Typography className="text-xs font-normal text-blue-gray-500">
                                  {email}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {role}
                            </Typography>
                            {/* <Typography className="text-xs font-normal text-blue-gray-500">
                          {job[1]}
                        </Typography> */}
                          </td>
                          <td className={className}>
                            <Chip
                            style={{"padding-top": "4px" , minWidth:"70px" , textAlign:"center"}}
                              variant="gradient"
                              color={flag == "active" ? "green" : "blue-gray"}
                              value={flag == "active" ? "active" : "deactive"}
                              className="py-0.5 px-2 text-[11px] font-medium w-fit"
                            />
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              2024/01/29
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography
                              as="a"
                              href="#"
                              className="text-xs font-semibold text-blue-gray-600"
                            >
                              {flag == "active" ? <Button style={{"width":"120px"}} variant="gradient" onClick={e => deactivateUser(id)}>
                                Deactivate
                              </Button> : <Button style={{"width":"120px"}} variant="gradient" onClick={e => activateUser(id)}>
                                Activate
                              </Button>}
                            </Typography>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </CardBody>
            <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
            <Typography variant="small" color="blue-gray" className="font-normal">
              Page {currentPage} of  {Math.round(state.userlist && state.userlist.length / usersPerPage)}
            </Typography>
            <div className="flex gap-2">
              <Paginate setCurrentPage={setCurrentPage} currentPage={currentPage} itemsPerPage={usersPerPage} totalItem={state.userlist && state.userlist.length} />
            </div>
          </CardFooter>
          </Card>
        </>
      }
    </div>
  );
}

export default Users;
