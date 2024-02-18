import {
    Card,
    CardBody,
    Typography,
    Tabs,
    TabsHeader,
    Tab,
    TabsBody,
    TabPanel,
    Input,
    Select,
    Chip,
    Option,
    Progress,
    IconButton,
} from "@material-tailwind/react";
import $ from "jquery";
import { useNavigate } from "react-router-dom";
import { TrashIcon, ArrowDownCircleIcon } from "@heroicons/react/24/solid";
import React, { useReducer, useState, useContext, useEffect } from "react";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import Paginate from '../../../widgets/layout/pagination'
import axios from 'axios';
import { LoaderContext } from '@/context/loaderContext';
import { ToasterContext } from '@/context/ToasterContext';
import { MultiSelect } from "react-multi-select-component";
import Datepicker from "react-tailwindcss-datepicker";


const DetailComponent = (props) => {

    const { setloader } = useContext(LoaderContext);
    const { setalertType, showtoast } = useContext(ToasterContext);
    const [selected, setSelected] = useState([]);
    const [options, setoptions] = useState([]);
    const [phaseStatus, setphaseStatus] = useState('');
    const [projectPhase, setprojectPhase] = useState('');
    const [detailData, setdetailData] = useState(props);

    const [enddate, setenddate] = useState('');
    // useEffect(() =>{
    //     if(detailData){
    //         console.log(detailData)
    //     }
    // },[detailData])

    const navigateTo = useNavigate();

    const [projectdate, setprojectdate] = useState({
        startDate: new Date(),
        endDate: new Date().setMonth(11)
    });



    const handleValueChange = (newValue) => {
        setprojectdate(newValue);
    }

    const listUsers = () => {
        setloader(true);
        axios.get('https://65.0.173.137/api/auth/users/',
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`
                }
            }
        )
            .then(function (response) {
                // handle success
                setoptions([]);
                response.data.data.map((users) => {
                    setoptions((options) => [...options, { label: users.username, value: users.username, id: users.id }])
                })
            })
            .catch(function (error) {
                // handle error

            })
            .finally(function () {
                // always executed
                setloader(false);

            });
    }

    const assignfunc = (id) => {
        console.log(detailData)
        let user_ids = [];

        selected.map((users) => {
            user_ids.push(users.id)
        });

        if (detailData.data.current_phase == "Backlog") {
            var payload = { "user_ids": user_ids, "phase_to_assign": "Production", "phase_note": "somenote heree,....", "phase_end_date": projectdate.startDate }
        } else {
            var payload = { "user_ids": user_ids, "phase_to_assign": detailData.data.current_phase, "phase_note": "somenote heree,....", "phase_end_date": projectdate.startDate }
        }


        setloader(true);
        axios.post(`https://65.0.173.137/api/projects/${id}/phase/`, payload,
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`
                }
            }
        )
            .then(function (response) {
                // handle success
                console.log(response);
                setalertType({ colour: "green", message: response.data.message });
                showtoast(true);
                setphaseStatus(response.data.data.project.phase.status)
                console.log(detailData)
                detailData.clearProjectdetail();
            })
            .catch(function (error) {
                console.log(error)
                // handle error
                setalertType({ colour: "red", message: error.response.data.message });
                showtoast(true);
            })
            .finally(function () {
                // always executed
                setSelected([]);
                setprojectdate({
                    startDate: new Date(),
                    endDate: new Date().setMonth(11)
                });
                setloader(false);
                setTimeout(() => { showtoast(false); }, 1500);
            });
    }

    const updateStatus = (status) => {
        setloader(true);
        axios.post(`https://65.0.173.137/api/projects/${detailData.data.id}/${status}/`, {},
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`
                }
            }
        ).then(function (response) {
            // handle success
            if (response.data.status == "success") {
                if (status == "done") {
                    setprojectPhase("Done");
                    detailData.clearProjectdetail();
                } else {
                    let phasestatus = response.data.data.phases.find(x => x.phase == response.data.data.current_phase);
                    setprojectPhase(phasestatus.status)
                }
            } else {
                setalertType({ colour: "red", message: response.data.message });
                showtoast(true);
            }

            setTimeout(() => { showtoast(false); }, 1500);
        })
            .catch(function (error) {
                // handle error
                console.log(error)
                // setalertType({ colour: "red", message: error.data.message });
                // showtoast(true);

            })
            .finally(function () {
                // always executed
                setloader(false);

            });
    }

    useEffect(() => {
        listUsers();
     
    }, []);
    useEffect(() => {
        if (detailData.data) {
            if (detailData.data.phases.length > 0) {
                console.log(detailData)
                let phasestatus = detailData.data.phases.find(x => x.phase == detailData.data.current_phase);
                if (phasestatus != undefined) {
                    setprojectPhase(phasestatus.status);
                }

            }

          
        }
    }, [detailData]);

    useEffect(() => {
        if (detailData) {
            if (options.length > 0 && detailData.data.phases.length > 0) {
                detailData && detailData.data.phases[0].assignees.map((name) => {
                    var ft = options.find(x => x.value == name);
                    setSelected((selected) => [...selected, options.find(x => x.value == name)]);
                })
            }

        }
    }, [options]);

    useEffect(() =>{
            if (detailData.data.phases.length > 0 && detailData.data.phases.find(x => x.phase == detailData.data.current_phase) != undefined ) {
                if (detailData.data.phases.find(x => x.phase == detailData.data.current_phase).phase_status_detail.end_date != undefined && detailData.data.phases.find(x => x.phase == detailData.data.current_phase).phase_status_detail.end_date != "") {
                  let date = detailData.data.phases.find(x => x.phase == detailData.data.current_phase).phase_status_detail.end_date
                  setenddate(new Date(date).toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}))
                }else{
                    setenddate("NA")
                }
            }else{
                setenddate(detailData.data.target_end_time)
            }
    },[props.forceRerender])

    // useEffect(() => {  
    //     alert(projectPhase)
    //     if (projectPhase == "Done") {

    //         setTimeout(() => { navigateTo("/dashboard/projects"); }, 100);
    //     }
    // }, [projectPhase]);


    return (
        <>
            <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-6 justify-between w-full">

                    <div>
                        <Typography variant="h5" color="blue-gray" className="mb-1">
                            {detailData.data.title}
                        </Typography>

                    </div>
                    {projectPhase && <div className="flex gap-6 items-center">
                        <Chip
                            style={{ textAlign: "center", height: "24px", borderRadius: "0px" }}
                            variant="gradient"
                            color="green"
                            value={projectPhase}
                            className=" w-12 py-0.5 px-2 pt-1 text-[11px] font-medium w-fit"
                        />

                        {projectPhase && projectPhase == "Open" ? <button
                            class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                            type="button" onClick={e => updateStatus("in-progress")}>
                            In Progress
                        </button> : projectPhase && projectPhase == "In-Progress" ? <button
                            class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                            type="button" onClick={e => updateStatus("done")}>
                            Completed
                        </button> : null}

                    </div>}

                </div>

            </div>
            <div className="gird-cols-1 mb-0 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-2">
                <ProfileInfoCard
                    title="DESCRIPTION"
                    description={detailData.data.description}
                    title1="NOTE"
                    note={detailData.data.note}
                />

                <div>
                    {/* {alert(detailData.data.current_phase)} */}
                    <ProfileInfoCard
                        title="PHASE"
                        description={detailData.data.current_phase}
                        title1="TARGET END DATE"
                        note={enddate}
                    />
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-52">
                    <MultiSelect
                        options={options}
                        value={selected}
                        onChange={setSelected}
                        labelledBy="Select"
                    />
                </div>
                <div className="w-52" style={{ border: "1px solid #ddd" }}>
                    <Datepicker
                        value={projectdate}
                        asSingle={true}
                        useRange={false}
                        onChange={handleValueChange}
                    />
                </div>
                <button
                    class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                    type="button"
                    onClick={e => assignfunc(detailData.data.id)}
                >
                    {
                        detailData.data.current_phase == "Backlog" ? "Assign to Production" : "Assign"
                    }
                </button>
            </div>

        </>
    )
}

const initialState = [
    {
        file: "",
        tag: "",
    },

];

function reducer(state, action) {
    switch (action.type) {
        case 'file': {
            return {
                ...state,
                file: action.value,
            };
        }
        case 'tag': {
            return {
                ...state,
                tag: action.value,
            };
        }
    }
}

const AttachmentsComponent = (props) => {

    const [state, dispatch] = useReducer(reducer, initialState);
    const [attachments, setAttachments] = useState(props.data.attachments);
    const [currentPage, setCurrentPage] = useState(1);
    const [attachmentsPerPage] = useState(3);
    const TABLE_HEAD = ["File", "Tag", "UploadedBy", "UploadedAt", "", ""];
    const indexOfLastPost = currentPage * attachmentsPerPage;
    const indexOfFirstPost = indexOfLastPost - attachmentsPerPage;
    const currentAttachments = attachments && attachments.slice(indexOfFirstPost, indexOfLastPost);

    const [crAttachments, setcrAttachments] = useState(currentAttachments);

    const { setloader } = useContext(LoaderContext);
    const { setalertType, showtoast } = useContext(ToasterContext);

    useEffect(() => {
        if (props.data) {
            let fliterattachments = props.data.attachments.filter((attachments) => attachments.phase == props.data.current_phase)
            setAttachments(fliterattachments)
        }
    }, [props.data, props.forceRerender]);


    useEffect(() => {
        if (attachments) {
            if (currentAttachments.length == 0) {
                let indexOfLastPost = parseInt(currentPage - 1) * attachmentsPerPage;
                let indexOfFirstPost = indexOfLastPost - attachmentsPerPage;
                setcrAttachments(attachments.slice(indexOfFirstPost, indexOfLastPost))
            } else {
                setcrAttachments(attachments.slice(indexOfFirstPost, indexOfLastPost))
            }
        }
    }, [attachments]);

    useEffect(() => {
        if (currentPage) {
            setcrAttachments(attachments.slice(indexOfFirstPost, indexOfLastPost))
        }
    }, [currentPage])


    const Upload = () => {
        setloader(true);
        axios.post(`https://65.0.173.137/api/projects/${localStorage.getItem('id')}/attachments/`, { file: state.file, "tag": state.tag },
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`,
                    'content-type': 'multipart/form-data'
                }
            }
        )
            .then(function (response) {
                // handle success 
                console.log(response)
                setalertType({ colour: "green", message: response.data.message });
                showtoast(true);
                setAttachments((attachments) => [...attachments, { "id": response.data.attachment.id, "file_name": response.data.attachment.file_name, "tag": response.data.attachment.tag, "uploaded_by": response.data.attachment.uploaded_by, "create_time": response.data.attachment.uploaded_at }]);
            })
            .catch(function (error) {
                // handle error
                setalertType({ colour: "red", message: error.response.data.message });
                showtoast(true);
            })
            .finally(function () {
                // always executed
                dispatch({ type: 'file', value: "" })
                dispatch({ type: 'tag', value: "" });
                setloader(false);
                setTimeout(() => { showtoast(false); }, 1500);
            });
    }


    const deletefile = (fileid) => {
        setloader(true);
        axios.delete(`https://65.0.173.137/api/projects/${localStorage.getItem('id')}/attachments/${fileid}/`,
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`,
                }
            }
        )
            .then(function (response) {
                // handle success
                setalertType({ colour: "green", message: response.data.message });
                showtoast(true);
                var fl = attachments.filter((attachment) => attachment.id != fileid);
                setAttachments(fl);

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
        <>
            <div className="">
                <h2 className="mb-5 text-black">Upload you Attachments Here.</h2>
                <div className="relative flex items-center grid-cols-3">
                    <div>
                        <div className="w-72 border border-solid border-slate-950">
                            <Input type="file" color="white" label="upoload" onChange={e => dispatch({ type: 'file', value: e.target.files[0] })} />
                        </div>

                        <p className="absolute top-50">{state.file && state.file.name}</p>
                    </div>

                    <div className="w-72 ml-10">
                        <Select
                            label="Select Tag"
                            animate={{
                                mount: { y: 0 },
                                unmount: { y: 25 },
                            }}
                            onChange={e => dispatch({ type: 'tag', value: e })}
                        >
                            <Option value="1">Raw</Option>
                            <Option value="2">Smooth</Option>
                            <Option value="3">Doc</Option>

                        </Select>
                    </div>

                    <div className="ml-10">
                        <button
                            class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                            type="button"
                            onClick={e => Upload()}
                        >
                            Upload
                        </button>
                    </div>
                </div>
                {/* <Progress className="mt-10" value={50} label="Completed" /> */}
            </div>

            <Card className="mt-10 h-full w-full">
                <table className="w-full min-w-max table-auto text-left ">
                    <thead>
                        <tr>
                            {TABLE_HEAD.map((head) => (
                                <th
                                    key={head}
                                    className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"
                                >
                                    <Typography
                                        variant="small"
                                        color="blue-gray"
                                        className="font-normal leading-none opacity-70"
                                    >
                                        {head}
                                    </Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {crAttachments ? crAttachments && crAttachments.map(({ file_name, tag, uploaded_by, create_time, id }, index) => {
                            var ft = new Date(create_time);

                            const isLast = index === crAttachments.length - 1;
                            const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

                            return (
                                <tr key={index}>
                                    <td className={classes}>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal"
                                        >
                                            {file_name.split("/").pop()}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal"
                                        >
                                            {tag}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal"
                                        >
                                            {uploaded_by}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal"
                                        >
                                            {`${ft.getDate()}-${ft.getMonth()}-${ft.getFullYear()} ${ft.getHours()}-${JSON.stringify(ft.getMinutes()).length > 1 ? ft.getMinutes() : '0' + ft.getMinutes()} ${ft.toLocaleTimeString()}`}
                                        </Typography>
                                    </td>
                                    <td>
                                        <IconButton variant="text">
                                            <ArrowDownCircleIcon className="h-4 w-4" />
                                        </IconButton>
                                    </td>
                                    <td>
                                        <IconButton variant="text">
                                            <TrashIcon className="h-4 w-4" onClick={e => deletefile(id)} />
                                        </IconButton>
                                    </td>
                                </tr>
                            );
                        }) : null}
                        {crAttachments && crAttachments.length == 0 ? <tr><td style={{ padding: "10px" }}>
                            No Attachments Found
                        </td></tr> : null}
                    </tbody>
                </table>
            </Card>
            {
                crAttachments && crAttachments.length > 0 ? <Paginate setCurrentPage={setCurrentPage} currentPage={currentPage} itemsPerPage={attachmentsPerPage} totalItem={attachments ? attachments.length : 0} /> : null
            }
        </>
    )
}


const Phases = (props) => {

    const [phases, setphases] = useState([{ name: "Backlog", active: true }, { name: "Production", active: false }, { name: "QC", active: false }, { name: "Delivery", active: false }, { name: "Completed", active: false }]);

    useEffect(() => {
        if (props) {
            if (props.data.data.current_phase == "Production" && props.data.data.phases.length == 1) {
                setphases([{ name: "Backlog", active: true }, { name: "Production", active: true }, { name: "QC", active: false }, { name: "Delivery", active: false }, { name: "Completed", active: false }])
            } else if (props.data.data.current_phase == "QC" && props.data.data.phases.length == 2) {
                setphases([{ name: "Backlog", active: true }, { name: "Production", active: true }, { name: "QC", active: true }, { name: "Delivery", active: false }, { name: "Completed", active: false }])
            }else if (props.data.data.current_phase == "Delivery" && props.data.data.phases.length == 3) {
                setphases([{ name: "Backlog", active: true }, { name: "Production", active: true }, { name: "QC", active: true }, { name: "Delivery", active: true }, { name: "Completed", active: false }])
            } else if (props.data.data.current_phase == "Completed" && props.data.data.phases.length == 3) {
                setphases([{ name: "Backlog", active: true }, { name: "Production", active: true }, { name: "QC", active: true }, { name: "Delivery", active: true }, { name: "Completed", active: true }])
            }
        }
    }, [props]);

    const getProjectDetail = (name) => {
        props.data.data.current_phase = name;
        console.log(props.data.data)
        props.setprDetail(props.data.data);
        props.setforceRerender(!props.forceRerender)
        $('.ch_tabs ul li:nth-child(1)').trigger("click");
    }

    return (
        <>
            <h1 className="font-medium text-3xl text-black mb-10">PHASES</h1>
            <div class="w-full px-24 py-4">
                <div class="relative flex items-center justify-between w-full">
                    <div class="absolute left-0 top-2/4 h-0.5 w-full -translate-y-2/4 bg-gray-300"></div>
                    <div class="absolute left-0 top-2/4 h-0.5 w-full -translate-y-2/4 bg-gray-900 transition-all duration-500">
                    </div>
                    {
                        phases && phases.map((value) =>
                            <div style={{ cursor: "pointer" }} onClick={e => value.active === true ? getProjectDetail(value.name) : null}
                                class={`${value.active === true ? "relative z-10 grid w-10 h-10 font-bold text-white transition-all duration-300 bg-gray-900 rounded-full place-items-center" : "relative z-10 grid w-10 h-10 font-bold text-gray-900  transition-all duration-300 bg-gray-300 rounded-full place-items-center"}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                                    aria-hidden="true" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495">
                                    </path>
                                </svg>
                                <div class="absolute -bottom-[4.5rem] w-max text-center">
                                    <h6
                                        class="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-gray-700">
                                        {value.name}
                                    </h6>

                                </div>
                            </div>
                        )
                    }
                </div>

            </div>
        </>
    )
}
export function ProjectDetail(props) {
    console.log(props)
    props.setactiveTabs(props.data.data.current_phase);
    const [prDetail, setprDetail] = useState(props.data.data);
    const [forceRerender, setforceRerender] = useState(true);
    const [data, setdata] = useState([]);


    useEffect(() => {
        if (props.data.data.current_phase == "Completed") {
            setdata([
                {
                    label: "Detail",
                    value: "detail",
                    desc: <DetailComponent data={prDetail} forceRerender={forceRerender} clearProjectdetail={props.clearProjectdetail} />,
                },
                {
                    label: "Phases",
                    value: "phases",
                    desc: <Phases data={props.data} setprDetail={setprDetail} setforceRerender={setforceRerender} forceRerender={forceRerender} />,
                },
            ])
        } else {
            setdata([
                {
                    label: "Detail",
                    value: "detail",
                    desc: <DetailComponent data={prDetail} forceRerender={forceRerender} clearProjectdetail={props.clearProjectdetail} />,
                },
                {
                    label: "Attachments",
                    value: "attachment",
                    desc: <AttachmentsComponent showLoader={props.showLoader} showToast={props.showToast} data={props.data.data} forceRerender={forceRerender} />,
                },
                {
                    label: "Phases",
                    value: "phases",
                    desc: <Phases data={props.data} setprDetail={setprDetail} setforceRerender={setforceRerender} forceRerender={forceRerender} />,
                },

            ])
        }
    }, [props.data.data.current_phase, prDetail])
    return (
        <>
            <button
                class="absolute top-20 right-10 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                type="button"
                onClick={e => props.clearProjectdetail()}
            >
                Back
            </button>

            <Card style={{ height: "500px" }} className="mx-3 mt-20 mb-6 lg:mx-4 border border-blue-gray-100 ch_tabs">
                <CardBody className="p-4">

                    <Tabs value="detail" orientation="vertical">
                        <TabsHeader className="w-60 h-60">
                            {data && data.map(({ label, value }) => (
                                <Tab key={value} value={value}>
                                    {label}
                                </Tab>
                            ))}
                        </TabsHeader>
                        <TabsBody>
                            {data && data.map(({ value, desc }) => (
                                <TabPanel key={value} value={value} className="py-0">
                                    {desc}
                                </TabPanel>
                            ))}
                        </TabsBody>
                    </Tabs>

                </CardBody>
            </Card>


        </>
    );
}

export default ProjectDetail;
