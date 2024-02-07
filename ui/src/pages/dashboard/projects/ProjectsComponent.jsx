
import React, { useReducer, useEffect, useContext, useState } from 'react';
import axios from 'axios';
import { LoaderContext } from '../../../context/loaderContext';
import { ToasterContext } from '@/context/ToasterContext';
import $ from "jquery";
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
import Paginate from '../../../widgets/layout/pagination'
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
    const { setloader } = useContext(LoaderContext);
    const { setalertType, showtoast } = useContext(ToasterContext);
    const [ProjectsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentProjects, setcurrentProjects] = useState([]);
    const indexOfLastPost = currentPage * ProjectsPerPage;
    const indexOfFirstPost = indexOfLastPost - ProjectsPerPage;


    useEffect(() => {
        if (props.projectlist != undefined) {
            console.log(props.projectlist)
            setTimeout(() => {
                $(`[data-value = ${props.activeTabs}]`).trigger('click');
                const filterPrbyPhase = props.projectlist.filter(projects => projects.phase.name == props.activeTabs);
                dispatch({ type: 'projectlist', value: filterPrbyPhase });
                let currentPr = filterPrbyPhase.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr);
            }, 100)

        }
    }, [props.projectlist])

    useEffect(() => {
        if (currentPage && props.projectlist != undefined && props.listType != undefined) {
            // alert(props.listType)
            const indexOfLastPost = currentPage * ProjectsPerPage;
            const indexOfFirstPost = indexOfLastPost - ProjectsPerPage;
            let currentPr = props.projectlist.slice(indexOfFirstPost, indexOfLastPost);
            if (props.listType == "Backlog") {
                const backlgs = props.projectlist.filter(projects => projects.phase.name == 'Backlog');
                let currentPr = backlgs.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr);
            } else if (props.listType == "Production") {
                const production = props.projectlist.filter(projects => projects.phase.name == 'Production');
                let currentPr = production.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr);
            } else if (props.listType == "QC") {
                const qc = props.projectlist.filter(projects => projects.phase.name == 'QC');
                let currentPr = qc.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr);
            } else if (props.listType == "Delivery") {
                const delivery = props.projectlist.filter(projects => projects.phase.name == 'Delivery');
                let currentPr = delivery.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr);
            } else if (props.listType == "Completed") {
                const completed = props.projectlist.filter(projects => projects.phase.name == 'Completed');
                let currentPr = completed.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr);
            }

        }
    }, [currentPage]);


    useEffect(() => {
        if (props.listType != undefined) {
            $('.pagination-container .gap-2 button:nth-child(1)').trigger("click");
            if (props.listType == "Backlog") {
                const backlgs = props.projectlist.filter(projects => projects.phase.name == 'Backlog');
                dispatch({ type: 'projectlist', value: backlgs });
                let currentPr = backlgs.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr)
            } else if (props.listType == "Production") {
                const production = props.projectlist.filter(projects => projects.phase.name == 'Production');
                dispatch({ type: 'projectlist', value: production });
                let currentPr = production.slice(indexOfFirstPost, indexOfLastPost);
                console.log(currentPr);
                setcurrentProjects(currentPr);
            } else if (props.listType == "QC") {
                console.log(props.projectlist)
                const production = props.projectlist.filter(projects => projects.phase.name == 'QC');
                dispatch({ type: 'projectlist', value: production });
                let currentPr = production.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr)
            } else if (props.listType == "Delivery") {
                const production = props.projectlist.filter(projects => projects.phase.name == 'Delivery');
                dispatch({ type: 'projectlist', value: production });
                let currentPr = production.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr)
            } else if (props.listType == "Completed") {
                const production = props.projectlist.filter(projects => projects.phase.name == 'Completed');
                dispatch({ type: 'projectlist', value: production });
                let currentPr = production.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(currentPr)
            }

        }
    }, [props.listType]);

    // useEffect(() => {
    //     if(props.projectlist){
    //         alert(props.projectlist.filter(projects => projects.phase.name == props.activeTabs).length)
    //     }
    // }, [currentProjects])

    const deleteProject = (id) => {
        setloader(true);
        axios.delete(`https://bellatrix1.pythonanywhere.com/projects/${id}/`,
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                }
            }
        ).then(function (response) {

            // handle success
            setalertType({ colour: "green", message: response.data.message });
            showtoast(true);
            props.loadProjectList();

            setTimeout(() => {
                const filterPrbyPhase = props.projectlist.filter(projects => projects.phase.name == props.activeTabs);
                let indexOfLastPost = parseInt(currentPage - 1) * ProjectsPerPage;
                let indexOfFirstPost = indexOfLastPost - ProjectsPerPage;
                let crprj = filterPrbyPhase.slice(indexOfFirstPost, indexOfLastPost);
                setcurrentProjects(crprj);
            }, 1000);

            setTimeout(() => {
                setCurrentPage(currentPage - 1)
            }, 1100)

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

    const getProjectDetail = (id) => {
        setloader(true);
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
                localStorage.setItem("id", id)
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
    return (
        <div>
            {/* <div className="absolute top-50" style={{ top: "50%", left: '50%', zIndex: "99999" }}>
                {state.loader ? <Spinner className="h-16 w-16 text-gray-900/50" /> : null}
            </div> */}

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
                <CardBody className="px-0">
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
                            {currentProjects.length > 0 ? currentProjects.map(
                                ({ title, description, author, target_end_time, id, phase }, index) => {
                                    const isLast = index === currentProjects.length - 1;
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

                                                <IconButton variant="text">
                                                    <PencilIcon className="h-4 w-4"
                                                    />
                                                </IconButton>

                                            </td>
                                            {
                                                phase.name == "Backlog" ?
                                                    <td>
                                                        <IconButton variant="text">
                                                            <TrashIcon className="h-4 w-4" onClick={e => deleteProject(id)} />
                                                        </IconButton>
                                                    </td> : null
                                            }
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
                {
                    currentProjects && currentProjects.length > 0 ? <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                            Page {currentPage} of  {Math.round(props.projectlist && props.projectlist.filter(projects => projects.phase.name == props.activeTabs).length / ProjectsPerPage)}
                        </Typography>
                        {currentPage && <div className="flex gap-2">
                            <Paginate setCurrentPage={setCurrentPage} currentPage={currentPage} itemsPerPage={ProjectsPerPage} totalItem={props.projectlist && props.projectlist.filter(projects => projects.phase.name == props.activeTabs).length} />
                        </div>}

                    </CardFooter> : null
                }

            </Card>
        </div>
    )
}

export default ProjectsComponent;