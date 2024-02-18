import React, { useEffect , useState } from "react";
import {
  Typography,
} from "@material-tailwind/react";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import axios from 'axios';

import {
  statisticsCardsData,
  statisticsChartsData,
} from "@/data";
import { ClockIcon } from "@heroicons/react/24/solid";


export function Home() {

  const [statistics , getStatistics] = useState([])

  useEffect(() => {
    getInfo();
  }, []);

  const getInfo = () => {
    axios.get(`https://65.0.173.137/api/auth/dashboard/`,
      {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`
        }
      }
    )
      .then(function (response) {
        // handle success 
        if (response.data.status == "success") {
          var incIndex = 0;
          for (const [key, value] of Object.entries(response.data.data)) {
            statisticsCardsData[incIndex].value = value;
            if (incIndex == 4) break;
            incIndex++;
          } 
          for (const [key, value] of Object.entries(response.data.data)) {
                if(key == "rate_of_change_backlog"){
                   console.log(statisticsCardsData[0])
                  statisticsCardsData[0].footer.value = `${parseInt(value)}%`;
                }else if(key == "rate_of_change_production"){
                  statisticsCardsData[1].footer.value = `${parseInt(value)}%`;
                }else if(key == "rate_of_change_qc"){
                  statisticsCardsData[2].footer.value = `${parseInt(value)}%`;
                }else if(key == "rate_of_change_delivery"){
                  statisticsCardsData[3].footer.value = `${parseInt(value)}%`;
                }else if(key == "rate_of_change_completed"){
                  statisticsCardsData[4].footer.value = `${parseInt(value)}%`;
                }
          }

         
          getStatistics(statisticsCardsData)
        }
      })
      .catch(function (error) {
        // handle error
      })
      .finally(function () {
        // always executed
      });
  }



  return (
    <div className="mt-12">
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {statistics && statistics.map(({ icon, title, footer, ...rest }) => (
          <StatisticsCard
            key={title}
            {...rest}
            title={title}
            icon={React.createElement(icon, {
              className: "w-6 h-6 text-white",
            })}
            footer={
              <Typography className="font-normal text-blue-gray-600">
                <strong className={footer.color}>{footer.value}</strong>
                &nbsp;{footer.label}
              </Typography>
            }
          />
        ))}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
        {statisticsChartsData.map((props) => (
          <StatisticsChart
            key={props.title}
            {...props}
            footer={
              <Typography
                variant="small"
                className="flex items-center font-normal text-blue-gray-600"
              >
                <ClockIcon strokeWidth={2} className="h-4 w-4 text-blue-gray-400" />
                &nbsp;{props.footer}
              </Typography>
            }
          />
        ))}
      </div>

    </div>
  );
}

export default Home;
