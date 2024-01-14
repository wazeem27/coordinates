
import React, { useReducer, useEffect } from 'react';
import axios from 'axios';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    CardFooter,
    Input,
    Button,
    IconButton,
    Popover,
    PopoverHandler,
    PopoverContent,
    Spinner
} from "@material-tailwind/react";
import { PencilIcon, UserPlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
    MagnifyingGlassIcon,
    ChevronUpDownIcon,
} from "@heroicons/react/24/outline";


const TABLE_HEAD = ["Project Title", "Project Description", "Author", "Date", "", ""];

const initialState = [
    {
        projectlist: "",
        loader: false
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
        case 'loader': {
            return {
                ...state,
                loader: action.value
            };
        }
    }
}

export function ProjectsComponent(props) {

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        if (props.projectlist != undefined) {
            // alert(JSON.stringify(props.projectlist))
            //   const backlgs = props.projectlist.filter(projects => projects.phase.name == 'Backlog');
            dispatch({ type: 'projectlist', value: props.projectlist })
        }
    }, [props.projectlist])


    useEffect(() => {
        if (props.listType != undefined) {
            // alert(props.listType)
            if (props.listType == "Backlog") {
                const backlgs = props.projectlist.filter(projects => projects.phase.name == 'Backlog');
                dispatch({ type: 'projectlist', value: backlgs })
            } else if (props.listType == "Production") {
                const production = props.projectlist.filter(projects => projects.phase.name == 'Production');
                dispatch({ type: 'projectlist', value: production })
            }
        }
    }, [props.listType])

    const deleteProject = (id) => {
        dispatch({ type: 'loader', value: true });
        axios.delete(`https://bellatrix1.pythonanywhere.com/projects/${id}/`,
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`
                }
            }
        )
            .then(function (response) {
                // handle success
                
                console/log(response)
              
                props.notify("Deleted" , "green");
            })
            .catch(function (error) {
                // handle error
                alert(error)
                // props.notify("Deleted" , "red");
            })
            .finally(function () {
                // always executed
                props.loadProjectList()
                dispatch({ type: 'loader', value: false });
            });
    }

    const getProjectDetail = (id) => {
        dispatch({ type: 'loader', value: true });
        axios.get(`https://bellatrix1.pythonanywhere.com/projects/${id}/`,
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`
                }
            }
        )
            .then(function (response) {
                // handle success
                props.getPrDetail(response.data)
                // dispatch({ type: 'projectlist', value: response.data });
                localStorage.setItem("id" , id)
            })
            .catch(function (error) {
                // handle error
            })
            .finally(function () {
                // always executed
            });
    }
    return (
        <div>
            <div className="absolute top-50" style={{ top: "50%", left: '50%', zIndex: "99999" }}>
                {state.loader ? <Spinner className="h-16 w-16 text-gray-900/50" /> : null}
            </div>

            <Card className="h-full w-full">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="mb-2 flex items-center justify-between gap-8">
                        <div>
                            <Typography variant="h5" color="blue-gray">
                                {props.listType}
                            </Typography>
                        </div>

                    </div>
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
                            {/* {console.log("pr" + JSON.stringify( state.projectlist))} */}
                            {state.projectlist ? state.projectlist.map(
                                ({ title, description, author, target_end_time, id }, index) => {
                                    const isLast = index === state.projectlist.length - 1;
                                    const classes = isLast
                                        ? "p-4"
                                        : "p-4 border-b border-blue-gray-50";

                                    return (
                                        <tr keys={id} >
                                            <td className={classes} onClick={e => getProjectDetail(id)}>
                                                <div className="flex items-center gap-3">
                                                    {/* <Avatar src={img} alt={name} size="sm" /> */}
                                                    <div className="flex flex-col">
                                                        <Typography
                                                            variant="small"
                                                            color="blue-gray"
                                                            className="font-normal"
                                                        >
                                                            {title}
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
                                                            {description}
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
                                                            {author.username}
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
                                                        {target_end_time}
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


                                            <td className={classes} >
                                                {/* <Popover >
                                                <PopoverHandler>
                                                  
                                                </PopoverHandler>
                                                <PopoverContent style={{zIndex:"9"}}>
                                                    <div className="cursor-pointer w-32 hoverf">
                                                        <p className="p-1 mb-3" style={{ display: 'block', width: '100%', float: "left" }}><span style={{ "float": "left", "padding-right": "10px" }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg></span>
                                                            <span style={{ "float": "left", "padding-right": "10px" }} >Edit</span></p>
                                                        <p className="p-1" >
                                                            <span style={{ "float": "left", "padding-right": "10px" }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                            </svg></span>
                                                            <span style={{ "float": "left", "padding-right": "10px" }}>Deactivate</span></p>
                                                    </div>
                                                </PopoverContent>
                                            </Popover> */}
                                                <IconButton variant="text">
                                                    <PencilIcon className="h-4 w-4"
                                                    />
                                                </IconButton>

                                            </td>
                                            <td>
                                                <IconButton variant="text">
                                                    <TrashIcon className="h-4 w-4" onClick={e => deleteProject(id)} />
                                                </IconButton>
                                            </td>
                                        </tr>
                                    );
                                },
                            ) : <tr>
                                <td className='pt-5 pl-10 '>
                                    No Projects Found
                                </td>
                            </tr>}
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
        </div>
    )
}

export default ProjectsComponent;