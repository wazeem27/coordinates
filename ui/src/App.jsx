import { useContext } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import { LoaderContext } from './context/loaderContext'
import { ToasterContext } from './context/ToasterContext'
import { Spinner } from "@material-tailwind/react";
import { Notifications } from "@/pages/dashboard";
function App() {
  const { loader } = useContext(LoaderContext);
  const { toast, alertType} = useContext(ToasterContext);
  return (
    <>
      {loader && <div className="fixed" style={{ top: 0, left: 0, width: "100%", height: "100vh", background: "#00000021", zIndex: "99999" }}>
        <div className="absolute" style={{ position: "absolute", top: "50%", left: "50%", }}><Spinner className="h-16 w-16 text-gray-900/50" /></div>
      </div>}

      {toast &&
        <Notifications alertType={alertType}/>
      }

      <Routes>
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>
    </>
  );
}

export default App;
