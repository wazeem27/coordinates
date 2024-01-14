import React, { useReducer, useEffect, useState } from "react";
import axios from 'axios';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button,
  Dialog,
  Card,
  Select, Option,
  CardBody,
  Typography,
  Input,
  CardFooter,
  Popover,
  PopoverHandler,
  PopoverContent,
  Spinner
} from "@material-tailwind/react";
import Datepicker from "react-tailwindcss-datepicker";
import { FolderPlusIcon, ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import ProjectsComponent from './ProjectsComponent'
import { Home, Tables, ProjectDetail, Notifications } from "@/pages/dashboard";

const initialState = [
  {
    projectlist: "",
    title: '',
    description: "",
    note: "",
    loader: false,
    projectdetail: "",
    listType: "Backlog",
    notification: {}
  },

];

function reducer(state, action) {

  switch (action.type) {
    case 'projectlist': {
      return {
        ...state,
        projectlist: action.value,
      };
    }
    case 'title': {
      return {
        ...state,
        title: action.value,
      };
    }
    case 'description': {
      return {
        ...state,
        description: action.value,
      };
    }
    case 'note': {
      return {
        ...state,
        note: action.value,
      };
    }
    case 'loader': {
      return {
        ...state,
        loader: action.value
      };
    }
    case 'projectdetail': {
      return {
        ...state,
        projectdetail: action.value
      };
    }
    case 'listType': {
      return {
        ...state,
        listType: action.value
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


export function Projects() {

  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(new Date());
  const [state, dispatch] = useReducer(reducer, initialState);
  const [value, setValue] = useState({
    startDate: new Date(),
    endDate: new Date().setMonth(11)
  });

  const handleOpen = () => setOpen((cur) => !cur);
  const handleValueChange = (newValue) => {
    console.log("newValue:", newValue);
    setValue(newValue);
  }
  const projectLists = () => {
    dispatch({ type: 'loader', value: true });
    axios.get('https://bellatrix1.pythonanywhere.com/projects/',
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success
        console.log(response);
        dispatch({ type: 'projectlist', value: response.data });
        dispatch({ type: 'loader', value: false });
      })
      .catch(function (error) {
        // handle error
      })
      .finally(function () {
        // always executed
      });
  }
  const closealerts = () => {
    dispatch({ type: 'notification', value: "" })
  }
  const createProject = () => {

    dispatch({ type: 'loader', value: true });
    axios.post('https://bellatrix1.pythonanywhere.com/projects/create/',
      {
        title: state.title,
        description: state.description,
        note: state.note,
        target_end_time: value.startDate
      },
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success
        dispatch({ type: 'notification', value: { message: "Project Created Successfully", colour: "green" } });
        console.log(response);
        setOpen((cur) => !cur);
        projectLists();
      })
      .catch(function (error) {
        // handle error
        dispatch({ type: 'notification', value: { message: "Project Creation Failed", colour: "red" } });
      })
      .finally(function () {
        // always executed
        dispatch({ type: 'loader', value: false });
        setTimeout(() => { closealerts(); }, 1500)
      });
  }

  // const createProject = () => {
  //   dispatch({ type: 'loader', value: true });
  // }
  useEffect(() => {
    projectLists()
  }, [])

  const loadProjectList = () => {
    projectLists()
  }

  const getPrDetail = (data) => {
    dispatch({ type: 'projectdetail', value: data })
  }
  const clearProjectdetail = (data) => {
    dispatch({ type: 'projectdetail', value: "" })
  }

  const onChangeTab = (label) => {
    dispatch({ type: "listType", value: label })
  }

  const showToast = (action, toast) => {
    if (toast == "green") {
      dispatch({ type: 'notification', value: { message: `${action} Successfully`, colour: "green" } });
    } else if (toast == "red") {
      dispatch({ type: 'notification', value: { message: `Somthing Went Wrong`, colour: "red" } });
    }

    setTimeout(() => {
      closealerts();
     }, 1500)
  
  }

  const showLoader = (loader) => {
    if (loader == "true") {
      dispatch({ type: 'loader', value: true });
    } else {
      dispatch({ type: 'loader', value: false });
    }
 
  
  }

  const data = [
    {
      label: "Backlog",
      value: "backlog",
      component: <ProjectsComponent notify={showToast} listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },
    {
      label: "Production",
      value: "production",
      component: <ProjectsComponent listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },

    {
      label: "QC",
      value: "qc",
      component: <ProjectsComponent listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },

    {
      label: "Delivery",
      value: "delivery",
      component: <ProjectsComponent listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },

    {
      label: "Completed",
      value: "completed",
      component: <ProjectsComponent listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },
  ];

  return (
    <div>
      <div className="absolute top-50" style={{ top: "50%", left: '50%', zIndex: "99999" }}>
        {state.loader ? <Spinner className="h-16 w-16 text-gray-900/50" /> : null}
      </div>
      {state.notification ? <Notifications alertType={{ colour: state.notification.colour, message: state.notification.message }} closealert={e => closealerts()} /> : null}
      {state.projectdetail ? <ProjectDetail showToast = {showToast} showLoader={showLoader} data={state.projectdetail} clearProjectdetail={clearProjectdetail} /> :
        <div><Dialog
          size="xl"
          open={open}
          handler={handleOpen}
          className="bg-transparent shadow-none"
        >
          <Card className="mx-auto w-full max-w-[50rem]">
            <CardBody className="flex flex-col gap-2.5">
              <Typography variant="h4" color="blue-gray">
                Create Project
              </Typography>
              <Typography className="-mb-2" variant="h6">
                Project Title
              </Typography>
              <Input label="Project Title" size="lg" onChange={(e) => dispatch({ type: 'title', value: e.target.value })} />

              <Typography className="-mb-2" variant="h6">
                Project Description
              </Typography>
              <Input label="Project Description" size="lg" onChange={(e) => dispatch({ type: 'description', value: e.target.value })} />

              <Typography className="-mb-2" variant="h6">
                Project Note
              </Typography>
              <Input label="Project Note" size="lg" onChange={(e) => dispatch({ type: 'note', value: e.target.value })} />

              <Typography className="-mb-2" variant="h6">
                Project Target End Time
              </Typography>
              <Datepicker
                value={value}
                asSingle={true}
                useRange={false}
                onChange={handleValueChange}
              />
            </CardBody>
            <CardFooter className="pt-0">
              <Button variant="gradient" onClick={e => createProject()} fullWidth>
                Create Project
              </Button>
            </CardFooter>
          </Card>
        </Dialog>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row mt-4 mb-4 float-right">
            <Button className="flex items-center gap-3" size="sm" onClick={e => handleOpen()}>
              <FolderPlusIcon strokeWidth={2} className="h-4 w-4" /> Create Project
            </Button>
          </div>
          <Tabs id="custom-animation" value="backlog" className='float-left w-full'>
            <TabsHeader>
              {data.map(({ label, value }) => (
                <Tab onClick={e => onChangeTab(label)} key={value} value={value}>
                  {label}
                </Tab>
              ))}
            </TabsHeader>
            <TabsBody
              animate={{
                initial: { y: 250 },
                mount: { y: 0 },
                unmount: { y: 250 },
              }}
            >
              {data.map(({ value, component }) => (
                <TabPanel key={value} value={value}>
                  {component}
                </TabPanel>
              ))}
            </TabsBody>
          </Tabs>
        </div>
      }
    </div>

  );
}