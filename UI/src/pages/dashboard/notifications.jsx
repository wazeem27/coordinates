import React, { useEffect } from "react";
import {
  Typography,
  Alert,
  Card,
  CardHeader,
  CardBody,
} from "@material-tailwind/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export function Notifications(props) {
  const [showAlerts, setShowAlerts] = React.useState({
    blue: false,
    green: false,
    orange: false,
    red: false,
  });
  const [showAlertsWithIcon, setShowAlertsWithIcon] = React.useState({
    blue: false,
    green: false,
    orange: false,
    red: false,
  });
  const alerts = [ "green", "orange", "red"];

  useEffect(() => {
    if (props.alertType) {
      if(props.alertType.colour == "red"){
        setShowAlerts({  blue: false,
          green: false,
          orange: false,
          red: true,})
      }else if(props.alertType.colour == "green"){
        setShowAlerts({  blue: false,
          green: true,
          orange: false,
          red: false,})
      }
      
    }
  }, [props])

  const onclosing = () => {
    setShowAlerts((current) => ({
      ...current, blue: false,
      green: false,
      orange: false,
      red: false,
    }));
    props.closealert()
  }
  return (
    <div style={{position:"absolute" ,width:"400px", right:"40%" , top :"0px"}} className="mx-auto my-0 flex max-w-screen-lg flex-col gap-8">
      <Card>
        {/* <CardHeader
          color="transparent"
          floated={false}
          shadow={false}
          className="m-0 p-4"
        >
          <Typography variant="h5" color="blue-gray">
            Alerts
          </Typography>
        </CardHeader> */}
        <CardBody className="flex flex-col gap-4 p-4">
          {alerts.map((color) => (
            <Alert
              key={color}
              open={showAlerts[color]}
              color={color}
              onClose={() => onclosing()}
              animate={{
                mount: { y: 0 },
                unmount: { y: 100 },
              }}
            >
             {props.alertType.message}
            </Alert>
          ))}
        </CardBody>
      </Card>
      {/* <Card>
        <CardHeader
          color="transparent"
          floated={false}
          shadow={false}
          className="m-0 p-4"
        >
          <Typography variant="h5" color="blue-gray">
            Alerts with Icon
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 p-4">
          {alerts.map((color) => (
            <Alert
              key={color}
              open={showAlertsWithIcon[color]}
              color={color}
              icon={
                <InformationCircleIcon strokeWidth={2} className="h-6 w-6" />
              }
              onClose={() => setShowAlertsWithIcon((current) => ({
                ...current,
                [color]: false,
              }))}
            >
              A simple {color} alert with an <a href="#">example link</a>. Give
              it a click if you like.
            </Alert>
          ))}
        </CardBody>
      </Card> */}
    </div>
  );
}

export default Notifications;
