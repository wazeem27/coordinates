import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Avatar,
  Typography,
  Tooltip,
  Button,
} from "@material-tailwind/react";
import {
  PencilSquareIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import { useEffect, useState, useContext } from "react";
import axios from 'axios';
import { LoaderContext } from '@/context/loaderContext';
import { ToasterContext } from '@/context/ToasterContext';
export function Profile() {

  const [Profile, setProfile] = useState();
  const [oldPassword, setoldPassword] = useState('');
  const [new_password, setnewPassword] = useState('');
  const [confirmPassword, setconfirmPassword] = useState('');
  const [updatePass, setupdatePass] = useState(false);

  const { setloader } = useContext(LoaderContext);
  const { setalertType, showtoast } = useContext(ToasterContext);

  const getProfile = () => {
    setloader(true);
    axios.get(`https://65.0.173.137/api/auth/profile/`,
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success 
        if (response.data.status == "success") {
          setProfile(response.data.data)
        }
      })
      .catch(function (error) {
        // handle error
      })
      .finally(function () {
        // always executed
        setloader(false);
      });
  }

  useEffect(() => {
    getProfile()
  }, [])

  const ShowPasswordUpdate = () => {
    setupdatePass(true)
  }

  const updateNewPassword = (id) => {
    setloader(true);
    axios.put(`https://65.0.173.137/api/auth/update/password/`, { "old_password": oldPassword, "new_password1": new_password, "new_password2": confirmPassword },
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
        }
      })
      .catch(function (error) {
        // handle error
        setalertType({ colour: "red", message: error.response.data.message });
        showtoast(true);
      })
      .finally(function () {
        // always executed
        setoldPassword('');
        setnewPassword('');
        setconfirmPassword('');
        setupdatePass(false);
        setloader(false);
        setTimeout(() => { showtoast(false); }, 1500);
      });
  }

  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover	bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <Avatar
                src="/img/bruce-mars.jpeg"
                alt="bruce-mars"
                size="xl"
                variant="rounded"
                className="rounded-lg shadow-lg shadow-blue-gray-500/40"
              />
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-1 capitalize">
                  {Profile && Profile.username}
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-600 capitalize"
                >
                  {Profile && Profile.role}
                </Typography>
              </div>
            </div>

          </div>
          <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-1 xl:grid-cols-1">

            <ProfileInfoCard
              title="Profile Information"
              description={`Hi, I'm ${Profile && Profile.username}, and I have role of ${Profile && Profile.role} at coordinates.`}
              details={{
                "first name": Profile && Profile.first_name,
                "Last name": Profile && Profile.last_name,
                email: Profile && Profile.email,
                // location: "USA",
                // social: (
                //   <div className="flex items-center gap-4">
                //     <i className="fa-brands fa-facebook text-blue-700" />
                //     <i className="fa-brands fa-twitter text-blue-400" />
                //     <i className="fa-brands fa-instagram text-purple-500" />
                //   </div>
                // ),
              }
              }
              action={
                <Tooltip content="Edit Profile">
                  <PencilIcon className="h-4 w-4 cursor-pointer text-blue-gray-500" />
                </Tooltip>
              }
            />
            <div className="text-black font-semibold capitalize flex items-center"><span>Password : </span>&nbsp;&nbsp;

              {updatePass ? <>
                <div class="relative h-10 w-100">
                  <input placeholder="Outlined"
                    type="password"
                    onChange={e => setoldPassword(e.target.value)}
                    class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50 placeholder:opacity-0 focus:placeholder:opacity-100" />
                  <label
                    class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                    Old Password
                  </label>
                </div>&nbsp;&nbsp;
                <div class="relative h-10 w-100">
                  <input placeholder="Outlined"
                    type="password"
                    class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50 placeholder:opacity-0 focus:placeholder:opacity-100"
                    onChange={e => setnewPassword(e.target.value)}
                  />
                  <label
                    class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                    New Password
                  </label>
                </div>&nbsp;&nbsp;
                <div class="relative h-10 w-100">
                  <input placeholder="Outlined"
                    type="password"
                    class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50 placeholder:opacity-0 focus:placeholder:opacity-100"
                    onChange={e => setconfirmPassword(e.target.value)}
                  />
                  <label
                    class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                    Confirm Password
                  </label>
                </div>&nbsp;&nbsp;
                <div class="flex w-100 divide-x divide-gray-800 row">
                  <button
                    onClick={e => updateNewPassword(Profile.id)}
                    class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none border-r-0 rounded-none"
                    type="button">
                    Update
                  </button>&nbsp;&nbsp;
                  <button
                    onClick={e => setupdatePass(false)}
                    class="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none border-r-0 rounded-none"
                    type="button">
                    Cancel
                  </button>
                </div>
              </> : <>
                <span style={{ marginTop: "8px" }}>***********************</span> &nbsp;&nbsp;<PencilSquareIcon className="h-4 w-4 cursor-pointer" onClick={e => ShowPasswordUpdate(e)} />&nbsp;&nbsp;
              </>}

            </div>
          </div>
          
        </CardBody>
      </Card>
    </>
  );
}

export default Profile;
