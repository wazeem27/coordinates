import {
    Typography, Card,
    CardBody,
    CardHeader,
    CardFooter,
    Button,
    Tooltip,
    Avatar,
    Input
} from "@material-tailwind/react";
import axios from 'axios';
import { ProfileInfoCard } from "@/widgets/cards";
import { projectsData } from "@/data";
import { Link } from "react-router-dom";
import { useEffect, useState , useContext } from "react";
import { LoaderContext } from '@/context/loaderContext';
import { ToasterContext } from '@/context/ToasterContext';

const TABLE_HEAD = ["Title", "Status"];

const TABLE_ROWS = [
    {
        name: "John Michael",
        job: "Manager",
    },
    {
        name: "Alexa Liras",
        job: "Developer",
    },
    {
        name: "Laurent Perrier",
        job: "Executive",
    },
    {
        name: "Michael Levi",
        job: "Developer",
    },
    {
        name: "Richard Gran",
        job: "Manager",
    },
];

export function UsersDetail(props) {

    const [recentProjects, setrecentProjects] = useState([]);
    const [shedit, setshedit] = useState(false);

    const [first_name, setfirst_name] = useState(props.userdetail.first_name);
    const [last_name, setlast_name] = useState(props.userdetail.last_name);
    const [username, setusername] = useState(props.userdetail.username);
    const [email, setemail] = useState(props.userdetail.email);

    const { setloader } = useContext(LoaderContext);
    const { setalertType, showtoast } = useContext(ToasterContext);

    useEffect(() => {

        if (props.userdetail.recentprojects) {
            // console.log(props.userdetail.recentprojects);
            var incIndex = 0;
            for (const [key, value] of Object.entries(props.userdetail.recentprojects)) {

                if (projectsData[incIndex] != undefined) {
                    projectsData[incIndex].title = value.title;
                    incIndex++;
                }

            }
            setrecentProjects(projectsData)
        }

    }, [props.userdetail.recentprojects]);
    
  
    const updateUser = (id) => {
        setloader(true);
        axios.put(`https://bellatrix1.pythonanywhere.com/auth/users/${id}/update/`, { "username": username, "email": email, "first_name": first_name , "last_name":last_name},
          {
            headers: {
              "Authorization": `Token ${localStorage.getItem("token")}`
            }
          }
        )
          .then(function (response) {
            // handle success 
            if (response.data.status == "success") {
              setalertType({ colour: "green", message: response.data.message });
              showtoast(true);
              setshedit(false)
            }
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
            

            {
                 shedit ?
                 <>
                 <button
                      style={{ "left": "auto", "right": "135px" }}
                      class="w-28 absolute top-20  align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                      type="button"
                      onClick={e => updateUser(props.userdetail.id)}
                  >
                      Update
                  </button>
      
                  <button
                      class="absolute top-20 right-10 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                      type="button"
                      onClick={e => setshedit(false)}
                  >
                      Cancel
                  </button>
                  </>:  <button
                style={{ "left": "auto", "right": "130px" }}
                class="absolute top-20 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                type="button"
                onClick={e => setshedit(true)}
            >
                
                Edit
            </button>
            }

            {
                !shedit ?
                <button
                class="absolute top-20 right-10 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                type="button"
                onClick={e => props.showuserdetail("")}
            >
                Back
            </button> : null 
            }
            <Card className=" mt-10 mb-6  border border-blue-gray-100">
                <CardBody className="p-4">
                    <h1 className="capitalize md:uppercase font-bold text-black mx-3 mb-5 text-xl">User Detail</h1>
                    <div className="gird-cols-1 mb-0 grid gap-2 px-4 lg:grid-cols-2 xl:grid-cols-2">
                        {
                            shedit ? <>
                                <div className="">
                                    <div className="w-72 mb-10">
                                        <Input id="first_name" name="first_name" label="First Name" value={first_name} onChange={e => setfirst_name(e.target.value)} />
                                    </div>
                                    <div className="w-72 ">
                                        <Input id="last_name" name="last_name" label="Last Name" value={last_name} onChange={e => setlast_name(e.target.value)}/>
                                    </div>
                                </div>
                                <div className="">
                                    <div className="w-72 mb-10">
                                        <Input id="email" name="email" label="Email" value={email} onChange={e => setemail(e.target.value)}/>
                                    </div>
                                    <div className="w-72">
                                        <Input id="username" name="username" label="User Name" value={username} onChange={e => setusername(e.target.value)}/>
                                    </div>
                                </div>
                            </> : <>
                                <ProfileInfoCard
                                    title="First Name"
                                    description={props.userdetail.first_name}
                                    title1="Email"
                                    note={props.userdetail.email}
                                />


                                <ProfileInfoCard
                                    title="Last Name"
                                    description={props.userdetail.last_name}
                                    title1="User Name"
                                    note={props.userdetail.username}
                                /></>
                        }




                        <ProfileInfoCard
                            title="Role"
                            description={props.userdetail.role}
                        />

                    </div>
                </CardBody>
            </Card>
            <Card className="h-full w-full p-4">

                <div className="px-4 pb-4">
                    <Typography variant="h6" color="blue-gray" className="mb-2">
                        Projects
                    </Typography>
                    {/* <Typography
                        variant="small"
                        className="font-normal text-blue-gray-500"
                    >
                        Architects design houses
                    </Typography> */}
                    <div className="mt-6 grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-4">
                        {recentProjects && recentProjects.map(
                            ({ img, title, description, tag, route, members }) => (
                                <Card key={title} color="transparent" shadow={false}>
                                    <CardHeader
                                        floated={false}
                                        color="gray"
                                        className="mx-0 mt-0 mb-4 h-64 xl:h-40"
                                    >
                                        <img
                                            src={img}
                                            alt={title}
                                            className="h-full w-full object-cover"
                                        />
                                    </CardHeader>
                                    <CardBody className="py-0 px-1">
                                        <Typography
                                            variant="small"
                                            className="font-normal text-blue-gray-500"
                                        >
                                            {tag}
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            color="blue-gray"
                                            className="mt-1 mb-2"
                                            style={{ textTransform: "capitalize" }}
                                        >
                                            {title}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            className="font-normal text-blue-gray-500"
                                        >
                                            {description}
                                        </Typography>
                                    </CardBody>
                                    <CardFooter className="mt-6 flex items-center justify-between py-0 px-1">
                                        <Link to="/dashboard/projects">
                                            <Button variant="outlined" size="sm">
                                                view project
                                            </Button>
                                        </Link>
                                        <div>
                                            {members.map(({ img, name }, key) => (
                                                <Tooltip key={name} content={name}>
                                                    <Avatar
                                                        src={img}
                                                        alt={name}
                                                        size="xs"
                                                        variant="circular"
                                                        className={`cursor-pointer border-2 border-white ${key === 0 ? "" : "-ml-2.5"
                                                            }`}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </CardFooter>
                                </Card>
                            )
                        )}
                    </div>
                </div>
            </Card>

        </div>
    )
}
