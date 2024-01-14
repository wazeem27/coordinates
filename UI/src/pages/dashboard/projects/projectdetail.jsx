import {
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Avatar,
    Typography,
    Tabs,
    TabsHeader,
    Tab,
    Switch,
    Tooltip,
    TabsBody,
    Button,
    TabPanel,
    Input,
    Select,
    Option
} from "@material-tailwind/react";
import React, { useReducer } from "react";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import axios from 'axios';

const DetailComponent = (props) => {
    return (
        <>
            <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-6">

                    <div>
                        <Typography variant="h5" color="blue-gray" className="mb-1">
                            {props.data.title}
                        </Typography>

                    </div>
                </div>

            </div>
            <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-2">
                <ProfileInfoCard
                    title="DESCRIPTION"
                    description={props.data.description}
                    title1="NOTE"
                    note={props.data.note}
                />

                <div>

                    <ProfileInfoCard
                        title="PHASE"
                        description={props.data.phase}
                        title1="END DATE"
                        note={props.data.target_end_time}
                    />
                </div>
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

    const Upload = () => {
        console.log(props)
        

         
        props.showLoader('true');
 
        axios.post(`https://bellatrix1.pythonanywhere.com/projects/${localStorage.getItem('id')}/attachments/`, { file: state.file, "tag": state.tag},
            {
                headers: {
                    "Authorization": `Token ${localStorage.getItem("token")}`,
                    'content-type': 'multipart/form-data'
                }
            }
        )
            .then(function (response) {
                // handle success
                console.log(response);
                props.showToast("Uploaded" ,"green")
            })
            .catch(function (error) {
                // handle error
                props.showToast("Uploaded"  , "red")
            })
            .finally(function () {
                // always executed
                dispatch({ type: 'file', value: "" })
                dispatch({ type: 'tag', value: "" });
                props.showLoader('false');
            });
    }
 

    return (
        <>
            <div className="">
                <h2 className="mb-5 text-black">Upload you Attachments Here.</h2>
                <div className="flex items-center grid-cols-3 ">
                    <div className="w-72 border border-solid border-slate-950">
                        <Input type="file" color="white" label="upoload" onChange={e => dispatch({ type: 'file', value: e.target.files[0] })} />
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
                            <Option value="1">Tag1</Option>
                            <Option value="2">Tag2</Option>
                            <Option value="3">Tag3</Option>

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
            </div>
        </>
    )
}


const Phases = () => {
    return (
        <>
        <h1 className="font-medium text-3xl text-black mb-10">PHASES</h1>
        <div class="w-full px-24 py-4">
            <div class="relative flex items-center justify-between w-full">
                <div class="absolute left-0 top-2/4 h-0.5 w-full -translate-y-2/4 bg-gray-300"></div>
                <div class="absolute left-0 top-2/4 h-0.5 w-full -translate-y-2/4 bg-gray-900 transition-all duration-500">
                </div>
                <div
                    class="relative z-10 grid w-10 h-10 font-bold text-white transition-all duration-300 bg-gray-900 rounded-full place-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                        aria-hidden="true" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495">
                        </path>
                    </svg>
                    <div class="absolute -bottom-[4.5rem] w-max text-center">
                        <h6
                            class="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
                            Backlog
                        </h6>
                        {/* <p class="block font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                            Details about yout account.
                        </p> */}
                    </div>
                </div>
                <div
                    class="relative z-10 grid w-10 h-10 font-bold text-gray-900  transition-all duration-300 bg-gray-300 rounded-full place-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                        aria-hidden="true" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495">
                        </path>
                    </svg>
                    <div class="absolute -bottom-[4.5rem] w-max text-center">
                        <h6
                            class="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-gray-700">
                            Production
                        </h6>
                        {/* <p class="block font-sans text-base antialiased font-normal leading-relaxed text-blue-gray-900">
                            Details about yout account.
                        </p> */}
                    </div>
                </div>
                <div
                    class="relative z-10 grid w-10 h-10 font-bold text-gray-900 transition-all duration-300 bg-gray-300 rounded-full place-items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                        aria-hidden="true" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495">
                        </path>
                    </svg>
                    <div class="absolute -bottom-[4.5rem] w-max text-center">
                        <h6
                            class="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-gray-700">
                            QC
                        </h6>
                        {/* <p class="block font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                            Details about yout account.
                        </p> */}
                    </div>
                </div>
                <div
                    class="relative z-10 grid w-10 h-10 font-bold text-gray-900 transition-all duration-300 bg-gray-300 rounded-full place-items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                        aria-hidden="true" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495">
                        </path>
                    </svg>
                    <div class="absolute -bottom-[4.5rem] w-max text-center">
                        <h6
                            class="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-gray-700">
                            Delivery
                        </h6>
                        {/* <p class="block font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                            Details about yout account.
                        </p> */}
                    </div>
                </div>
                <div
                    class="relative z-10 grid w-10 h-10 font-bold text-gray-900 transition-all duration-300 bg-gray-300 rounded-full place-items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                        aria-hidden="true" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495">
                        </path>
                    </svg>
                    <div class="absolute -bottom-[4.5rem] w-max text-center">
                        <h6
                            class="block font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-gray-700">
                            Completed
                        </h6>
                        {/* <p class="block font-sans text-base antialiased font-normal leading-relaxed text-gray-700">
                            Details about yout account.
                        </p> */}
                    </div>
                </div>
            </div>
             
        </div>
        </>
    )
}
export function ProjectDetail(props) {
    const data = [
        {
            label: "Detail",
            value: "detail",
            desc: <DetailComponent data={props.data} />,
        },
        {
            label: "Attachments",
            value: "attachment",
            desc: <AttachmentsComponent showLoader={props.showLoader} showToast={props.showToast}/>,
        },
        {
            label: "Phases",
            value: "phases",
            desc: <Phases />,
        },

    ];
    return (
        <>
            <button
                class="absolute top-20 right-10 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                type="button"
                onClick={e => props.clearProjectdetail()}
            >
                Back
            </button>

            <Card style={{ height: "500px" }} className="mx-3 mt-20 mb-6 lg:mx-4 border border-blue-gray-100">
                <CardBody className="p-4">

                    <Tabs value="detail" orientation="vertical">
                        <TabsHeader className="w-60 h-60">
                            {data.map(({ label, value }) => (
                                <Tab key={value} value={value}>
                                    {label}
                                </Tab>
                            ))}
                        </TabsHeader>
                        <TabsBody>
                            {data.map(({ value, desc }) => (
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
