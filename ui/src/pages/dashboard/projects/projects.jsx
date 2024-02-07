import React, { useReducer, useEffect, useState, useContext } from "react";
import axios from 'axios';
import { LoaderContext } from '@/context/loaderContext';
import { ToasterContext } from '@/context/ToasterContext';
import $ from "jquery";
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
import { ProjectDetail, Notifications } from "@/pages/dashboard";

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
  const { setloader } = useContext(LoaderContext);
  const { setalertType, showtoast } = useContext(ToasterContext);
  const [open, setOpen] = React.useState(false);
  const [activeTabs, setactiveTabs] = React.useState("Backlog");
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
    setloader(true);
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
      })
      .catch(function (error) {
        // handle error
      })
      .finally(function () {
        // always executed
        setloader(false);
      });
  }
  const closealerts = () => {
    dispatch({ type: 'notification', value: "" })
  }
  const createProject = () => {

    setloader(true);
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
        setalertType({ colour: "green", message: response.data.message });
        showtoast(true);
        setOpen((cur) => !cur);
        projectLists();
        setactiveTabs("Backlog")
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


  useEffect(() => {
    projectLists()
  }, [])

  const loadProjectList = () => {
    projectLists();
  }

  const getPrDetail = (data) => {
    dispatch({ type: 'projectdetail', value: data })
  } 
  const clearProjectdetail = (data) => {
    dispatch({ type: 'projectdetail', value: "" }); 
    projectLists(); 
  }

  const onChangeTab = (label) => {
    dispatch({ type: "listType", value: label })
  }

  const showToast = (action, toast) => {
    if (toast == "green") {
      setalertType({ colour: "green", message: `${action} Successfully` });
      showtoast(true);
    } else if (toast == "red") {
      setalertType({ colour: "red", message: action });
      showtoast(true);
    }
    setTimeout(() => { showtoast(false); }, 1500);
  }

  const showLoader = (loader) => {
    if (loader == "true") {
      setloader(true);
    } else {
      setloader(false);
    }


  }

  const data = [
    {
      label: "Backlog",
      value: "Backlog",
      component: <ProjectsComponent activeTabs={activeTabs} notify={showToast} listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },
    {
      label: "Production",
      value: "Production",
      component: <ProjectsComponent activeTabs={activeTabs} listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },

    {
      label: "QC",
      value: "QC",
      component: <ProjectsComponent  activeTabs={activeTabs} listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },

    {
      label: "Delivery",
      value: "Delivery",
      component: <ProjectsComponent activeTabs={activeTabs} listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },

    {
      label: "Completed",
      value: "Completed",
      component: <ProjectsComponent activeTabs={activeTabs} listType={state.listType} projectlist={state.projectlist} loadProjectList={loadProjectList} getPrDetail={getPrDetail} />,
    },
  ];

  return (
    <div>
      {/* {state.loader ? <div className="absolute" style={{ top: 0, left: 0, width: "100%", height: "100%", background: "#00000021", zIndex: "99"}}>
        <div className="absolute" style={{ position: "absolute", top: "50%", left: "50%", }}><Spinner className="h-16 w-16 text-gray-900/50" /></div>
      </div> : null} */}
      {state.notification ? <Notifications alertType={{ colour: state.notification.colour, message: state.notification.message }} closealert={e => closealerts()} /> : null}
      {state.projectdetail ? <ProjectDetail setactiveTabs={setactiveTabs} showToast={showToast} showLoader={showLoader} data={state.projectdetail} clearProjectdetail={clearProjectdetail} /> :
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
              <div  style={{border:"1px solid #b0bec5" , "borderRadius":"5px"}}>
              <Datepicker
             
                value={value}
                asSingle={true}
                useRange={false}
                onChange={handleValueChange}
              />
              </div>
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
          <Tabs id="custom-animation" value={activeTabs ? activeTabs : null} className='float-left w-full'>
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